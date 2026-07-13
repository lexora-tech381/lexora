"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
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

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function mapSignupError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("email address is already")
  ) {
    return "This email address is already registered.";
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
    return "Too many attempts. Please wait before trying again.";
  }

  return "We couldn't create your account. Please try again.";
}

function SignupBrand() {
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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmationPending, setIsConfirmationPending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
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

    async function checkExistingSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Signup session check error:", error);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSigningUp) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Full name must be 100 characters or fewer.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSigningUp(true);

    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      setErrorMessage(mapSignupError(signUpError.message));
      setIsSigningUp(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setIsSigningUp(false);
    setIsConfirmationPending(true);
    setSuccessMessage(
      "Account created successfully. Please check your email and click the confirmation link before signing in.",
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
        .lexora-signup-btn:hover:not(:disabled) {
          filter: brightness(1.05);
        }
        .lexora-signup-link:hover {
          color: #5b21b6;
        }
        .lexora-signup-toggle:hover {
          color: #6d28d9;
        }
        .lexora-signup-btn:focus-visible,
        .lexora-signup-link:focus-visible,
        .lexora-signup-toggle:focus-visible,
        .lexora-signup-back:focus-visible,
        .lexora-signup-checkbox:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Link href="/" className="lexora-signup-back" style={backButton}>
        <ArrowLeft size={18} />
        Back to Humanizer
      </Link>

      <section
        style={{
          ...card,
          padding: isMobile ? "28px 20px" : "40px",
        }}
      >
        <SignupBrand />

        <h1 style={{ ...title, fontSize: isMobile ? "28px" : "32px" }}>
          {isConfirmationPending ? "Check your email" : "Create your account"}
        </h1>
        <p style={subtitle}>
          {isConfirmationPending
            ? "Confirm your email address to finish setting up Lexora."
            : "Join Lexora and start rewriting content with clarity and control."}
        </p>

        {isConfirmationPending ? (
          <div>
            {successMessage ? (
              <div style={successBox} role="status">
                <CheckCircle2 size={16} aria-hidden />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <Link
              href="/login"
              className="lexora-signup-btn"
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
          <form onSubmit={handleSignUp} noValidate>
            <label htmlFor="fullName" style={label}>
              Full name
            </label>
            <div
              style={{
                ...inputWithIcon,
                ...(fullNameFocused ? inputFocused : null),
                borderColor: errorMessage
                  ? "#fca5a5"
                  : fullNameFocused
                    ? "#8b5cf6"
                    : "#e2e8f0",
              }}
            >
              <User size={18} color="#94a3b8" aria-hidden />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                style={innerInput}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                onFocus={() => setFullNameFocused(true)}
                onBlur={() => setFullNameFocused(false)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isSigningUp}
                maxLength={100}
              />
            </div>

            <label htmlFor="email" style={label}>
              Email address
            </label>
            <div
              style={{
                ...inputWithIcon,
                ...(emailFocused ? inputFocused : null),
                borderColor: errorMessage
                  ? "#fca5a5"
                  : emailFocused
                    ? "#8b5cf6"
                    : "#e2e8f0",
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
                disabled={isSigningUp}
              />
            </div>

            <label htmlFor="password" style={label}>
              Password
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
                placeholder="Create a password"
                style={innerInput}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isSigningUp}
              />
              <button
                type="button"
                className="lexora-signup-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={visibilityButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label htmlFor="confirmPassword" style={label}>
              Confirm password
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
                placeholder="Confirm your password"
                style={innerInput}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isSigningUp}
              />
              <button
                type="button"
                className="lexora-signup-toggle"
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

            <div style={termsRow}>
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                className="lexora-signup-checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                disabled={isSigningUp}
                aria-invalid={Boolean(errorMessage)}
                style={checkbox}
              />
              <label htmlFor="termsAccepted" style={termsLabel}>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="lexora-signup-link"
                  style={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="lexora-signup-link"
                  style={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
                .
              </label>
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
              className="lexora-signup-btn"
              disabled={isSigningUp}
              style={{
                ...buttonStyle,
                opacity: isSigningUp ? 0.7 : 1,
                cursor: isSigningUp ? "not-allowed" : "pointer",
              }}
            >
              {isSigningUp ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        {!isConfirmationPending ? (
          <>
            <div style={securityNote}>
              <ShieldCheck size={16} aria-hidden />
              Your account is securely authenticated.
            </div>

            <p style={bottomText}>
              Already have an account?{" "}
              <Link href="/login" className="lexora-signup-link" style={link}>
                Login
              </Link>
            </p>
          </>
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

const termsRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  marginTop: "18px",
  marginBottom: "18px",
};

const checkbox = {
  width: "18px",
  height: "18px",
  marginTop: "2px",
  flexShrink: 0,
  accentColor: "#7c3aed",
  cursor: "pointer",
};

const termsLabel = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
  cursor: "pointer",
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
