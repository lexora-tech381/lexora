"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  LifeBuoy,
  LogOut,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";

const planName = "Free";
const dailyLimit = 10;

function getUserInitial(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().charAt(0).toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function mapProfileError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("too many") ||
    normalized.includes("rate limit") ||
    normalized.includes("over_request_rate_limit")
  ) {
    return "Too many attempts. Please wait before trying again.";
  }

  return "We could not update your profile. Please try again.";
}

function mapPasswordError(message: string): string {
  const normalized = message.toLowerCase();

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

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [todayUsage, setTodayUsage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Settings session error:", error);
        setCheckingAuth(false);
        router.replace("/login");
        return;
      }

      if (!currentSession) {
        setCheckingAuth(false);
        router.replace("/login");
        return;
      }

      setSession(currentSession);
      setEmail(currentSession.user.email || "");
      setFullName(
        typeof currentSession.user.user_metadata?.full_name === "string"
          ? currentSession.user.user_metadata.full_name
          : "",
      );

      const today = new Date().toISOString().split("T")[0];
      const { data: usage, error: usageError } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", currentSession.user.id)
        .eq("date", today)
        .maybeSingle();

      if (usageError) {
        console.error("Settings usage error:", usageError);
      } else if (isMounted) {
        setTodayUsage(usage?.count || 0);
      }

      if (isMounted) setCheckingAuth(false);
    }

    loadSettings();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      if (!nextSession) {
        setSession(null);
        router.replace("/login");
        return;
      }

      setSession(nextSession);
      setEmail(nextSession.user.email || "");
      setFullName(
        typeof nextSession.user.user_metadata?.full_name === "string"
          ? nextSession.user.user_metadata.full_name
          : "",
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Settings logout error:", error);
      setSignOutError("We could not sign you out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
  };

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingProfile) return;

    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = fullName.trim();

    if (trimmedName.length < 2) {
      setProfileError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (trimmedName.length > 100) {
      setProfileError("Full name must be 100 characters or fewer.");
      return;
    }

    setIsSavingProfile(true);

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
      },
    });

    setIsSavingProfile(false);

    if (error) {
      console.error("Settings profile update error:", error);
      setProfileError(mapProfileError(error.message));
      return;
    }

    if (data.user) {
      setFullName(
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : trimmedName,
      );
      setSession((prev) =>
        prev
          ? {
              ...prev,
              user: data.user,
            }
          : prev,
      );
    }

    setProfileSuccess("Profile updated successfully.");
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUpdatingPassword) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!isStrongPassword(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    if (!confirmPassword) {
      setPasswordError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsUpdatingPassword(false);

    if (error) {
      console.error("Settings password update error:", error);
      setPasswordError(mapPasswordError(error.message));
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess("Password updated successfully.");
  }

  if (checkingAuth || !session) {
    return (
      <main
        style={{
          ...pageShell,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        <div style={loadingCard} role="status" aria-live="polite">
          Loading settings…
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...pageShell,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        .lexora-settings-btn:hover:not(:disabled) {
          filter: brightness(1.04);
        }
        .lexora-settings-outline:hover:not(:disabled) {
          background: #faf5ff;
        }
        .lexora-settings-danger:hover:not(:disabled) {
          background: #fef2f2;
        }
        .lexora-settings-link:hover {
          color: #5b21b6;
        }
        .lexora-settings-toggle:hover {
          color: #6d28d9;
        }
        .lexora-settings-btn:focus-visible,
        .lexora-settings-outline:focus-visible,
        .lexora-settings-danger:focus-visible,
        .lexora-settings-link:focus-visible,
        .lexora-settings-toggle:focus-visible,
        .lexora-settings-input:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/settings"
        onLogout={handleLogout}
      />

      <section style={contentShell}>
        <Header
          isMobile={isMobile}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          onCloseMenu={() => setMenuOpen(false)}
          onNavigate={navigate}
          session={session}
          uses={todayUsage}
          getUserInitial={getUserInitial}
          planName={planName}
          dailyLimit={dailyLimit}
          onLogout={handleLogout}
          activePath="/settings"
        />

        <div
          style={{
            ...contentPad,
            padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
          }}
        >
          <header style={hero}>
            <h1 style={{ ...title, fontSize: isMobile ? "30px" : "36px" }}>
              Settings
            </h1>
            <p style={subtitle}>
              Manage your Lexora profile, password, and account options.
            </p>
          </header>

          <div
            style={{
              ...settingsGrid,
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            }}
          >
            <section style={settingsCard} aria-labelledby="profile-heading">
              <div style={cardHeading}>
                <div style={cardIcon}>
                  <UserIcon size={20} aria-hidden />
                </div>
                <div>
                  <h2 id="profile-heading" style={cardTitle}>
                    Profile
                  </h2>
                  <p style={cardText}>Update the name shown on your account.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} noValidate>
                <label htmlFor="settings-full-name" style={label}>
                  Full name
                </label>
                <input
                  id="settings-full-name"
                  name="fullName"
                  className="lexora-settings-input"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  maxLength={100}
                  disabled={isSavingProfile}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setProfileError(null);
                    setProfileSuccess(null);
                  }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  aria-invalid={Boolean(profileError)}
                  style={{
                    ...input,
                    ...(nameFocused ? inputFocused : null),
                    borderColor: profileError
                      ? "#fca5a5"
                      : nameFocused
                        ? "#8b5cf6"
                        : "#e2e8f0",
                  }}
                />

                <label htmlFor="settings-email" style={label}>
                  Email address
                </label>
                <input
                  id="settings-email"
                  name="email"
                  type="email"
                  value={email}
                  disabled
                  autoComplete="email"
                  style={{ ...input, opacity: 0.7, cursor: "not-allowed" }}
                />
                <p style={helpText}>
                  Email changes are not available from Settings yet.
                </p>

                {profileError ? (
                  <div style={errorBox} role="alert">
                    <AlertCircle size={16} aria-hidden />
                    <span>{profileError}</span>
                  </div>
                ) : null}

                {profileSuccess ? (
                  <div style={successBox} role="status">
                    <CheckCircle2 size={16} aria-hidden />
                    <span>{profileSuccess}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="lexora-settings-btn"
                  disabled={isSavingProfile}
                  style={{
                    ...primaryButton,
                    opacity: isSavingProfile ? 0.7 : 1,
                    cursor: isSavingProfile ? "wait" : "pointer",
                  }}
                >
                  <Save size={16} aria-hidden />
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </button>
              </form>
            </section>

            <section style={settingsCard} aria-labelledby="security-heading">
              <div style={cardHeading}>
                <div style={cardIcon}>
                  <Shield size={20} aria-hidden />
                </div>
                <div>
                  <h2 id="security-heading" style={cardTitle}>
                    Password & security
                  </h2>
                  <p style={cardText}>
                    Change your password while signed in.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} noValidate>
                <label htmlFor="settings-new-password" style={label}>
                  New password
                </label>
                <div
                  style={{
                    ...inputWithIcon,
                    ...(newPasswordFocused ? inputFocused : null),
                    borderColor: passwordError
                      ? "#fca5a5"
                      : newPasswordFocused
                        ? "#8b5cf6"
                        : "#e2e8f0",
                  }}
                >
                  <KeyRound size={18} color="#94a3b8" aria-hidden />
                  <input
                    id="settings-new-password"
                    name="newPassword"
                    className="lexora-settings-input"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter a new password"
                    value={newPassword}
                    disabled={isUpdatingPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => setNewPasswordFocused(false)}
                    aria-invalid={Boolean(passwordError)}
                    style={innerInput}
                  />
                  <button
                    type="button"
                    className="lexora-settings-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                    style={visibilityButton}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <label htmlFor="settings-confirm-password" style={label}>
                  Confirm new password
                </label>
                <div
                  style={{
                    ...inputWithIcon,
                    ...(confirmFocused ? inputFocused : null),
                    borderColor: passwordError
                      ? "#fca5a5"
                      : confirmFocused
                        ? "#8b5cf6"
                        : "#e2e8f0",
                  }}
                >
                  <KeyRound size={18} color="#94a3b8" aria-hidden />
                  <input
                    id="settings-confirm-password"
                    name="confirmPassword"
                    className="lexora-settings-input"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    disabled={isUpdatingPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    aria-invalid={Boolean(passwordError)}
                    style={innerInput}
                  />
                  <button
                    type="button"
                    className="lexora-settings-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    style={visibilityButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <p style={helpText}>
                  Use at least 8 characters with an uppercase letter, a lowercase
                  letter, and a number.
                </p>

                {passwordError ? (
                  <div style={errorBox} role="alert">
                    <AlertCircle size={16} aria-hidden />
                    <span>{passwordError}</span>
                  </div>
                ) : null}

                {passwordSuccess ? (
                  <div style={successBox} role="status">
                    <CheckCircle2 size={16} aria-hidden />
                    <span>{passwordSuccess}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="lexora-settings-btn"
                  disabled={isUpdatingPassword}
                  style={{
                    ...primaryButton,
                    opacity: isUpdatingPassword ? 0.7 : 1,
                    cursor: isUpdatingPassword ? "wait" : "pointer",
                  }}
                >
                  <KeyRound size={16} aria-hidden />
                  {isUpdatingPassword ? "Updating..." : "Update password"}
                </button>
              </form>
            </section>

            <section style={settingsCard} aria-labelledby="plan-heading">
              <div style={cardHeading}>
                <div style={cardIcon}>
                  <CreditCard size={20} aria-hidden />
                </div>
                <div>
                  <h2 id="plan-heading" style={cardTitle}>
                    Plan
                  </h2>
                  <p style={cardText}>
                    View your current Lexora access and available upgrades.
                  </p>
                </div>
              </div>

              <div style={planBox}>
                <div>
                  <p style={planLabel}>Current access</p>
                  <p style={planValue}>Free plan</p>
                  <p style={cardText}>
                    {dailyLimit} rewrites per day. Paid plan status will appear
                    here once billing verification is connected.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="lexora-settings-outline"
                  style={outlineButton}
                >
                  View plans
                </Link>
              </div>
            </section>

            <section style={settingsCard} aria-labelledby="account-heading">
              <div style={cardHeading}>
                <div style={cardIcon}>
                  <LifeBuoy size={20} aria-hidden />
                </div>
                <div>
                  <h2 id="account-heading" style={cardTitle}>
                    Account
                  </h2>
                  <p style={cardText}>
                    Sign out or get help with account requests.
                  </p>
                </div>
              </div>

              <div style={accountStack}>
                <div style={securityRow}>
                  <div>
                    <h3 style={securityTitle}>Sign out</h3>
                    <p style={cardText}>
                      End your session on this device.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="lexora-settings-danger"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    style={{
                      ...dangerButton,
                      opacity: isSigningOut ? 0.7 : 1,
                      cursor: isSigningOut ? "wait" : "pointer",
                    }}
                  >
                    <LogOut size={16} aria-hidden />
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>

                {signOutError ? (
                  <div style={errorBox} role="alert">
                    <AlertCircle size={16} aria-hidden />
                    <span>{signOutError}</span>
                  </div>
                ) : null}

                <div style={divider} />

                <div style={securityRow}>
                  <div>
                    <h3 style={securityTitle}>Need account help?</h3>
                    <p style={cardText}>
                      Contact Support for billing questions or account deletion
                      requests.
                    </p>
                  </div>
                  <Link
                    href="/support"
                    className="lexora-settings-outline"
                    style={outlineButton}
                  >
                    Contact support
                  </Link>
                </div>

                <p style={legalLinks}>
                  <Link
                    href="/privacy"
                    className="lexora-settings-link"
                    style={inlineLink}
                  >
                    Privacy Policy
                  </Link>
                  <span aria-hidden> · </span>
                  <Link
                    href="/terms"
                    className="lexora-settings-link"
                    style={inlineLink}
                  >
                    Terms of Service
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

const pageShell = {
  minHeight: "100vh",
  display: "flex",
  backgroundImage:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
};

const loadingCard = {
  width: "100%",
  maxWidth: "420px",
  margin: "40px 16px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "28px 24px",
  textAlign: "center" as const,
  color: "#64748b",
  fontSize: "14px",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
};

const contentShell = {
  flex: 1,
  minWidth: 0,
  width: "100%",
};

const contentPad = {
  width: "100%",
  maxWidth: "1120px",
  margin: "0 auto",
  boxSizing: "border-box" as const,
};

const hero = {
  marginBottom: "24px",
};

const title = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  lineHeight: 1.15,
};

const subtitle = {
  margin: 0,
  color: "#64748b",
  fontSize: "16px",
  lineHeight: 1.6,
  maxWidth: "560px",
};

const settingsGrid = {
  display: "grid",
  gap: "18px",
  alignItems: "start",
};

const settingsCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "22px 18px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box" as const,
};

const cardHeading = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "18px",
};

const cardIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const cardTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const cardText = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const label = {
  display: "block",
  margin: "0 0 8px",
  fontWeight: 600 as const,
  fontSize: "13px",
  color: "#334155",
};

const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "15px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  minHeight: "48px",
  marginBottom: "14px",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const inputFocused = {
  boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.15)",
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
  marginBottom: "14px",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
  margin: "-6px 0 14px",
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const primaryButton = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontWeight: 700 as const,
  fontSize: "14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
};

const outlineButton = {
  border: "1px solid #ddd6fe",
  background: "#ffffff",
  color: "#7c3aed",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700 as const,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
  textDecoration: "none",
  fontSize: "13px",
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

const dangerButton = {
  ...outlineButton,
  border: "1px solid #fecaca",
  color: "#b91c1c",
  background: "#ffffff",
  gap: "6px",
};

const planBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
  background: "#faf5ff",
  border: "1px solid #e9d5ff",
  borderRadius: "14px",
  padding: "16px",
};

const planLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const planValue = {
  margin: "4px 0 6px",
  fontSize: "20px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const accountStack = {
  display: "grid",
  gap: "16px",
};

const securityRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const securityTitle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const divider = {
  height: "1px",
  background: "#eef2f7",
};

const legalLinks = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
};

const inlineLink = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: 600 as const,
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
