"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapLoginError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("email or password")
  ) {
    return "The email address or password is incorrect.";
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("not confirmed")
  ) {
    return "Please confirm your email address before signing in.";
  }

  if (
    normalized.includes("too many") ||
    normalized.includes("rate limit") ||
    normalized.includes("over_request_rate_limit")
  ) {
    return "Too many login attempts. Please wait and try again.";
  }

  return "We could not sign you in. Please check your connection and try again.";
}

function mapResetError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid") &&
    normalized.includes("email")
  ) {
    return "Please enter a valid email address.";
  }

  if (
    normalized.includes("too many") ||
    normalized.includes("rate limit") ||
    normalized.includes("over_request_rate_limit")
  ) {
    return "Too many reset requests. Please wait before trying again.";
  }

  return "We could not send the reset link. Please try again.";
}

function LoginBrand() {
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Login session check error:", error);
        setCheckingSession(false);
        return;
      }

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoggingIn) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInError) {
      console.error("Login error:", signInError);
      setErrorMessage(mapLoginError(signInError.message));
      setIsLoggingIn(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setErrorMessage(
      "We could not sign you in. Please check your connection and try again.",
    );
    setIsLoggingIn(false);
  }

  async function handlePasswordReset() {
    if (isSendingReset) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSendingReset(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    setIsSendingReset(false);

    if (error) {
      console.error("Password reset error:", error);
      setErrorMessage(mapResetError(error.message));
      return;
    }

    setSuccessMessage(
      "A password reset link has been sent. Please check your email.",
    );
  }

  if (checkingSession) {
    return (
      <main
        style={{
          ...page,
          padding: isMobile ? "20px 16px" : "40px",
        }}
      >
        <div style={loadingCard} role="status" aria-live="polite">
          Checking your session…
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
        .lexora-login-btn:hover:not(:disabled) {
          filter: brightness(1.05);
        }
        .lexora-login-link:hover {
          color: #5b21b6;
        }
        .lexora-login-toggle:hover {
          color: #6d28d9;
        }
        .lexora-login-btn:focus-visible,
        .lexora-login-link:focus-visible,
        .lexora-login-toggle:focus-visible,
        .lexora-login-back:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Link href="/" className="lexora-login-back" style={backButton}>
        <ArrowLeft size={18} />
        Back to Humanizer
      </Link>

      <section
        style={{
          ...card,
          padding: isMobile ? "28px 20px" : "40px",
        }}
      >
        <LoginBrand />

        <h1 style={{ ...title, fontSize: isMobile ? "28px" : "32px" }}>
          Welcome back
        </h1>
        <p style={subtitle}>
          Sign in to access your Lexora workspace and saved documents.
        </p>

        <form onSubmit={handleLogin} noValidate>
          <label htmlFor="email" style={label}>
            Email address
          </label>
          <div
            style={{
              ...inputWithIcon,
              ...(emailFocused ? inputFocused : null),
              borderColor: errorMessage ? "#fca5a5" : emailFocused ? "#8b5cf6" : "#e2e8f0",
            }}
          >
            <Mail size={18} color="#94a3b8" aria-hidden />
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              style={innerInput}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              aria-invalid={Boolean(errorMessage)}
              disabled={isLoggingIn || isSendingReset}
            />
          </div>

          <label htmlFor="password" style={label}>
            Password
          </label>
          <div
            style={{
              ...inputWithIcon,
              ...(passwordFocused ? inputFocused : null),
              borderColor: errorMessage ? "#fca5a5" : passwordFocused ? "#8b5cf6" : "#e2e8f0",
            }}
          >
            <Lock size={18} color="#94a3b8" aria-hidden />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              style={innerInput}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              aria-invalid={Boolean(errorMessage)}
              disabled={isLoggingIn || isSendingReset}
            />
            <button
              type="button"
              className="lexora-login-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={visibilityButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={row}>
            <button
              type="button"
              className="lexora-login-link"
              onClick={handlePasswordReset}
              disabled={isSendingReset || isLoggingIn}
              style={{
                ...forgotButton,
                opacity: isSendingReset || isLoggingIn ? 0.65 : 1,
                cursor:
                  isSendingReset || isLoggingIn ? "not-allowed" : "pointer",
              }}
            >
              {isSendingReset ? "Sending..." : "Forgot password?"}
            </button>
          </div>

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
            className="lexora-login-btn"
            disabled={isLoggingIn || isSendingReset}
            style={{
              ...buttonStyle,
              opacity: isLoggingIn || isSendingReset ? 0.7 : 1,
              cursor:
                isLoggingIn || isSendingReset ? "not-allowed" : "pointer",
            }}
          >
            {isLoggingIn ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={securityNote}>
          <ShieldCheck size={16} aria-hidden />
          Your account is securely authenticated.
        </div>

        <p style={bottomText}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="lexora-login-link" style={link}>
            Sign Up
          </Link>
        </p>
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

const row = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: "14px",
  marginBottom: "18px",
};

const forgotButton = {
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  fontWeight: 600 as const,
  cursor: "pointer",
  padding: "8px 0",
  fontSize: "14px",
  minHeight: "40px",
  transition: "color 0.15s ease",
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
