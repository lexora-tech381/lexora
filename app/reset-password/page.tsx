"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function mapPasswordUpdateError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp") ||
    normalized.includes("token") ||
    normalized.includes("session")
  ) {
    return "This password reset link may have expired. Please request a new one from the login page.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") ||
      normalized.includes("short") ||
      normalized.includes("least") ||
      normalized.includes("strength"))
  ) {
    return "Please choose a stronger password.";
  }

  if (
    normalized.includes("same") ||
    normalized.includes("different from the old")
  ) {
    return "Please choose a password that is different from your current one.";
  }

  if (
    normalized.includes("too many") ||
    normalized.includes("rate limit") ||
    normalized.includes("over_request_rate_limit")
  ) {
    return "Too many attempts. Please wait before trying again.";
  }

  return "We could not update your password. Please try again.";
}

function ResetBrand() {
  return (
    <div style={brandRow}>
      <div style={logoMark}>
        <div style={logoInner} />
        <span style={logoSparkle} aria-hidden>
          ✦
        </span>
      </div>
      <div>
        <h2 style={brandName}>Lexora</h2>
        <p style={brandTagline}>AI Humanizer</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    function markReady(hasSession: boolean) {
      if (!isMounted) return;
      setHasRecoverySession(hasSession);
      setCheckingLink(false);
    }

    async function checkRecoverySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Reset password session check error:", error);
      }

      if (session) {
        markReady(true);
        return;
      }

      // Recovery links can take a moment for the client to parse URL tokens.
      settleTimer = setTimeout(async () => {
        const {
          data: { session: delayedSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        markReady(Boolean(delayedSession));
      }, 1200);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        if (settleTimer) {
          clearTimeout(settleTimer);
          settleTimer = null;
        }
        markReady(true);
      }
    });

    return () => {
      isMounted = false;
      if (settleTimer) clearTimeout(settleTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUpdatingPassword || isComplete) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("Reset password update error:", updateError);
      setErrorMessage(mapPasswordUpdateError(updateError.message));
      setIsUpdatingPassword(false);
      return;
    }

    setIsUpdatingPassword(false);
    setIsComplete(true);
    setSuccessMessage(
      "Password updated successfully. You can now sign in with your new password.",
    );
    setPassword("");
    setConfirmPassword("");

    window.setTimeout(() => {
      router.replace("/login");
    }, 1800);
  }

  if (checkingLink) {
    return (
      <main
        style={{
          ...page,
          padding: isMobile ? "20px 16px" : "40px",
        }}
      >
        <div style={loadingCard} role="status" aria-live="polite">
          Verifying your reset link…
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...page,
        padding: isMobile ? "72px 16px 28px" : "40px",
      }}
    >
      <style>{`
        .lexora-reset-btn:hover:not(:disabled) {
          filter: brightness(1.05);
        }
        .lexora-reset-link:hover {
          color: #5b21b6;
        }
        .lexora-reset-toggle:hover {
          color: #6d28d9;
        }
        .lexora-reset-btn:focus-visible,
        .lexora-reset-link:focus-visible,
        .lexora-reset-toggle:focus-visible,
        .lexora-reset-back:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Link href="/login" className="lexora-reset-back" style={backButton}>
        <ArrowLeft size={18} />
        Back to login
      </Link>

      <section
        style={{
          ...card,
          padding: isMobile ? "28px 20px" : "40px",
        }}
      >
        <ResetBrand />

        <h1 style={{ ...title, fontSize: isMobile ? "28px" : "32px" }}>
          {isComplete ? "Password updated" : "Create a new password"}
        </h1>
        <p style={subtitle}>
          {isComplete
            ? "Your Lexora password has been changed. Redirecting you to login…"
            : "Choose a strong new password for your Lexora account."}
        </p>

        {!hasRecoverySession && !isComplete ? (
          <div>
            <div style={errorBox} role="alert">
              <AlertCircle size={16} aria-hidden />
              <span>
                This password reset link is missing, invalid, or has expired.
                Request a new link from the login page.
              </span>
            </div>
            <Link
              href="/login"
              className="lexora-reset-btn"
              style={{
                ...buttonStyle,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Go to Login
            </Link>
          </div>
        ) : isComplete ? (
          <div>
            {successMessage ? (
              <div style={successBox} role="status">
                <CheckCircle2 size={16} aria-hidden />
                <span>{successMessage}</span>
              </div>
            ) : null}
            <Link
              href="/login"
              className="lexora-reset-btn"
              style={{
                ...buttonStyle,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} noValidate>
            <label htmlFor="password" style={label}>
              New password
            </label>
            <div
              style={{
                ...inputWithIcon,
                ...(passwordFocused ? inputFocused : null),
                borderColor: errorMessage
                  ? "#fca5a5"
                  : passwordFocused
                    ? "#8b5cf6"
                    : "#e2e8f0",
              }}
            >
              <Lock size={18} color="#94a3b8" aria-hidden />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a new password"
                style={innerInput}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isUpdatingPassword}
              />
              <button
                type="button"
                className="lexora-reset-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={visibilityButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label htmlFor="confirmPassword" style={label}>
              Confirm new password
            </label>
            <div
              style={{
                ...inputWithIcon,
                ...(confirmFocused ? inputFocused : null),
                borderColor: errorMessage
                  ? "#fca5a5"
                  : confirmFocused
                    ? "#8b5cf6"
                    : "#e2e8f0",
              }}
            >
              <Lock size={18} color="#94a3b8" aria-hidden />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your new password"
                style={innerInput}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isUpdatingPassword}
              />
              <button
                type="button"
                className="lexora-reset-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                style={visibilityButton}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p style={helpText}>
              Use at least 8 characters with an uppercase letter, a lowercase
              letter, and a number.
            </p>

            {errorMessage ? (
              <div style={errorBox} role="alert">
                <AlertCircle size={16} aria-hidden />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            {successMessage ? (
              <div style={successBox} role="status">
                <CheckCircle2 size={16} aria-hidden />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <button
              type="submit"
              className="lexora-reset-btn"
              disabled={isUpdatingPassword}
              style={{
                ...buttonStyle,
                opacity: isUpdatingPassword ? 0.7 : 1,
                cursor: isUpdatingPassword ? "not-allowed" : "pointer",
              }}
            >
              {isUpdatingPassword ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}

        <div style={securityNote}>
          <ShieldCheck size={16} aria-hidden />
          Your account is securely authenticated.
        </div>

        {!isComplete ? (
          <p style={bottomText}>
            Remembered your password?{" "}
            <Link href="/login" className="lexora-reset-link" style={link}>
              Login
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  backgroundImage:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  backgroundColor: "#f8fafc",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  color: "#0f172a",
  position: "relative" as const,
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
};

const loadingCard = {
  width: "100%",
  maxWidth: "460px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "28px 24px",
  textAlign: "center" as const,
  color: "#64748b",
  fontSize: "14px",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
};

const backButton = {
  position: "absolute" as const,
  top: "20px",
  left: "16px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "transparent",
  border: "none",
  color: "#7c3aed",
  fontWeight: 600 as const,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "14px",
  minHeight: "40px",
  padding: "8px 4px",
};

const card = {
  width: "100%",
  maxWidth: "460px",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.07)",
  boxSizing: "border-box" as const,
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "22px",
};

const logoMark = {
  width: "48px",
  height: "48px",
  background: "linear-gradient(135deg,#5b21b6,#c084fc)",
  clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
  position: "relative" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const logoInner = {
  width: "18px",
  height: "24px",
  borderLeft: "7px solid white",
  borderBottom: "7px solid white",
  borderBottomLeftRadius: "8px",
  transform: "translateY(-1px)",
};

const logoSparkle = {
  position: "absolute" as const,
  top: "-10px",
  right: "-12px",
  color: "#a855f7",
  fontSize: "16px",
  fontWeight: 700 as const,
  lineHeight: 1,
};

const brandName = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800 as const,
  color: "#0f172a",
  letterSpacing: "-0.03em",
};

const brandTagline = {
  margin: 0,
  fontSize: "13px",
  color: "#7c3aed",
  fontWeight: 600 as const,
};

const title = {
  textAlign: "center" as const,
  margin: "0 0 8px",
  fontWeight: 700 as const,
  letterSpacing: "-0.025em",
  color: "#0f172a",
  lineHeight: 1.2,
};

const subtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  margin: "0 0 28px",
  fontSize: "15px",
  lineHeight: 1.6,
};

const label = {
  display: "block",
  fontWeight: 600 as const,
  marginBottom: "8px",
  marginTop: "16px",
  color: "#334155",
  fontSize: "13px",
};

const inputWithIcon = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "0 12px",
  background: "#ffffff",
  minHeight: "48px",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const inputFocused = {
  boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.15)",
};

const innerInput = {
  flex: 1,
  padding: "12px 0",
  border: "none",
  outline: "none",
  fontSize: "15px",
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  minWidth: 0,
};

const visibilityButton = {
  border: "none",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px",
  minWidth: "36px",
  minHeight: "36px",
};

const helpText = {
  margin: "10px 0 18px",
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const link = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: 600 as const,
};

const buttonStyle = {
  width: "100%",
  padding: "14px 16px",
  minHeight: "48px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: 600 as const,
  fontSize: "15px",
  transition: "filter 0.15s ease, opacity 0.15s ease",
  fontFamily: "inherit",
};

const securityNote = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "7px",
  color: "#64748b",
  fontSize: "13px",
};

const bottomText = {
  textAlign: "center" as const,
  color: "#64748b",
  marginTop: "22px",
  marginBottom: 0,
  fontSize: "14px",
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "14px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  lineHeight: 1.5,
};

const successBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "14px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#15803d",
  fontSize: "14px",
  lineHeight: 1.5,
};
