"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

type CallbackStatus = "loading" | "success" | "error";

function getFriendlyCallbackError(message?: string): string {
  const normalized = (message || "").toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp") ||
    normalized.includes("code")
  ) {
    return "This confirmation link is invalid or has expired. Please request a new one and try again.";
  }

  return "We could not confirm your account. Please try again from the login page.";
}

function clearCallbackParamsFromUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, "/auth/callback");
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState(
    "Confirming your account. Please wait…",
  );

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let isMounted = true;

    async function completeAuthCallback() {
      try {
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");
        const errorParam = currentUrl.searchParams.get("error");
        const errorCode = currentUrl.searchParams.get("error_code");
        const errorDescription =
          currentUrl.searchParams.get("error_description");

        if (errorParam || errorCode || errorDescription) {
          console.error("Auth callback provider error:", {
            errorParam,
            errorCode,
          });
          if (!isMounted) return;
          setStatus("error");
          setMessage(
            getFriendlyCallbackError(errorDescription || errorParam || ""),
          );
          clearCallbackParamsFromUrl();
          return;
        }

        if (code) {
          // exchangeCodeForSession expects the auth code string only — not the full URL.
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Auth callback code exchange error:", error);
            if (!isMounted) return;
            setStatus("error");
            setMessage(getFriendlyCallbackError(error.message));
            clearCallbackParamsFromUrl();
            return;
          }
        } else {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Auth callback setSession error:", error);
              if (!isMounted) return;
              setStatus("error");
              setMessage(getFriendlyCallbackError(error.message));
              clearCallbackParamsFromUrl();
              return;
            }
          } else {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
              await new Promise((resolve) => window.setTimeout(resolve, 600));
              const {
                data: { session: delayedSession },
              } = await supabase.auth.getSession();

              if (!delayedSession) {
                if (!isMounted) return;
                setStatus("error");
                setMessage(
                  "This confirmation link is missing or invalid. Please open the latest link from your email, or sign in if your account is already confirmed.",
                );
                clearCallbackParamsFromUrl();
                return;
              }
            }
          }
        }

        clearCallbackParamsFromUrl();

        if (!isMounted) return;
        setStatus("success");
        setMessage(
          "Your account is confirmed. Redirecting to your dashboard…",
        );
        router.replace("/dashboard");
      } catch (error) {
        console.error("Auth callback unexpected error:", error);
        if (!isMounted) return;
        setStatus("error");
        setMessage(
          "Something went wrong while confirming your account. Please try again.",
        );
        clearCallbackParamsFromUrl();
      }
    }

    completeAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main style={page}>
      <style>{`
        .lexora-callback-link:hover {
          color: #5b21b6;
        }
        .lexora-callback-btn:hover {
          filter: brightness(1.05);
        }
        .lexora-callback-link:focus-visible,
        .lexora-callback-btn:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <section style={card} aria-live="polite">
        <div style={brandRow}>
          <div style={logoMark}>
            <div style={logoInner} />
            <span style={logoSparkle} aria-hidden>
              ✦
            </span>
          </div>
          <div>
            <h1 style={brandName}>Lexora</h1>
            <p style={brandTagline}>AI Humanizer</p>
          </div>
        </div>

        {status === "loading" ? (
          <>
            <div style={iconWrap} aria-hidden>
              <LoaderCircle size={28} color="#7c3aed" className="spin" />
            </div>
            <h2 style={title}>Confirming your account</h2>
            <p style={subtitle}>{message}</p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <div style={successIconWrap} aria-hidden>
              <CheckCircle2 size={28} color="#15803d" />
            </div>
            <h2 style={title}>Email confirmed</h2>
            <div style={successBox} role="status">
              <CheckCircle2 size={16} aria-hidden />
              <span>{message}</span>
            </div>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <div style={errorIconWrap} aria-hidden>
              <AlertCircle size={28} color="#b91c1c" />
            </div>
            <h2 style={title}>Confirmation failed</h2>
            <div style={errorBox} role="alert">
              <AlertCircle size={16} aria-hidden />
              <span>{message}</span>
            </div>
            <div style={actions}>
              <Link
                href="/login"
                className="lexora-callback-btn"
                style={primaryButton}
              >
                Go to Login
              </Link>
              <Link
                href="/signup"
                className="lexora-callback-link"
                style={secondaryLink}
              >
                Back to Sign Up
              </Link>
            </div>
          </>
        ) : null}
      </section>

      <style>{`
        @keyframes lexora-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: lexora-spin 0.9s linear infinite;
        }
      `}</style>
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
  padding: "24px 16px",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  color: "#0f172a",
  boxSizing: "border-box" as const,
};

const card = {
  width: "100%",
  maxWidth: "460px",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.07)",
  padding: "36px 28px",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "24px",
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

const iconWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "14px",
};

const successIconWrap = {
  ...iconWrap,
};

const errorIconWrap = {
  ...iconWrap,
};

const title = {
  margin: "0 0 10px",
  fontSize: "24px",
  fontWeight: 700 as const,
  letterSpacing: "-0.025em",
  color: "#0f172a",
};

const subtitle = {
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.6,
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  textAlign: "left" as const,
  margin: "0 0 18px",
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
  textAlign: "left" as const,
  margin: 0,
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#15803d",
  fontSize: "14px",
  lineHeight: 1.5,
};

const actions = {
  display: "grid",
  gap: "12px",
};

const primaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  borderRadius: "12px",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 600 as const,
  fontSize: "15px",
};

const secondaryLink = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: 600 as const,
  fontSize: "14px",
  minHeight: "40px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
