"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

const SUPPORT_EMAIL = "supportlexora@gmail.com";
const planName = "Free";
const dailyLimit = 10;

type IssueType = "billing" | "technical" | "account" | "general" | "";

type FormState = {
  name: string;
  email: string;
  issueType: IssueType;
  message: string;
  website: string;
};

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const ISSUE_OPTIONS: { value: Exclude<IssueType, "">; label: string }[] = [
  { value: "billing", label: "Billing issue" },
  { value: "technical", label: "Technical problem" },
  { value: "account", label: "Account support" },
  { value: "general", label: "General question" },
];

const FAQ_ITEMS = [
  {
    question: "How many free rewrites do I get?",
    answer:
      "The Free plan includes 10 rewrites per day. Paid plans use monthly word allowances shown on the Pricing page.",
  },
  {
    question: "How do I upgrade?",
    answer:
      "Open the Pricing page, choose Silver, Gold, or Premium, and continue through Polar’s secure checkout.",
  },
  {
    question: "How is my content handled?",
    answer:
      "Submitted text is processed to provide rewriting, and documents are saved only when you choose to save them. Details are explained in the Privacy Policy.",
  },
  {
    question: "How do I manage or cancel a subscription?",
    answer:
      "Contact Support with your account email and plan details. Account-based billing management will be available once that portal is connected.",
  },
  {
    question: "When will support reply?",
    answer:
      "Most support replies arrive within about 24 hours. Response times can vary during busy periods.",
  },
] as const;

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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildMailtoHref(form: FormState): string {
  const issueLabel =
    ISSUE_OPTIONS.find((option) => option.value === form.issueType)?.label ||
    "Support request";
  const subject = `Lexora Support — ${issueLabel}`;
  const body = [
    `Name: ${form.name.trim()}`,
    `Email: ${form.email.trim()}`,
    `Issue type: ${issueLabel}`,
    "",
    form.message.trim(),
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildGmailHref(form: FormState): string {
  const issueLabel =
    ISSUE_OPTIONS.find((option) => option.value === form.issueType)?.label ||
    "Support request";
  const subject = `Lexora Support — ${issueLabel}`;
  const body = [
    `Name: ${form.name.trim()}`,
    `Email: ${form.email.trim()}`,
    `Issue type: ${issueLabel}`,
    "",
    form.message.trim(),
  ].join("\n");

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function SupportPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [todayUsage, setTodayUsage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    issueType: "",
    message: "",
    website: "",
  });

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Support session error:", error);
        setAuthLoading(false);
        return;
      }

      setSession(currentSession);

      if (currentSession) {
        const metadataName = currentSession.user.user_metadata?.full_name;
        setForm((prev) => ({
          ...prev,
          name:
            prev.name ||
            (typeof metadataName === "string" ? metadataName : "") ||
            "",
          email: prev.email || currentSession.user.email || "",
        }));

        const today = new Date().toISOString().split("T")[0];
        const { data: usage, error: usageError } = await supabase
          .from("usage")
          .select("count")
          .eq("user_id", currentSession.user.id)
          .eq("date", today)
          .maybeSingle();

        if (usageError) {
          console.error("Support usage error:", usageError);
        } else if (isMounted) {
          setTodayUsage(usage?.count || 0);
        }
      }

      if (isMounted) setAuthLoading(false);
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);

      if (nextSession) {
        const metadataName = nextSession.user.user_metadata?.full_name;
        setForm((prev) => ({
          ...prev,
          name:
            prev.name ||
            (typeof metadataName === "string" ? metadataName : "") ||
            "",
          email: prev.email || nextSession.user.email || "",
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const gmailComposeUrl = useMemo(() => {
    if (
      form.name.trim().length >= 2 &&
      isValidEmail(form.email.trim()) &&
      form.issueType &&
      form.message.trim().length >= 20
    ) {
      return buildGmailHref(form);
    }
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent("Lexora AI Support")}`;
  }, [form]);

  function validateForm(current: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (current.name.trim().length < 2) {
      nextErrors.name = "Enter your name (at least 2 characters).";
    }

    if (!isValidEmail(current.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!current.issueType) {
      nextErrors.issueType = "Choose an issue type.";
    }

    if (current.message.trim().length < 20) {
      nextErrors.message =
        "Describe your issue in a bit more detail (at least 20 characters).";
    }

    return nextErrors;
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !prev.form) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setSuccessMessage(null);
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          issueType: form.issueType,
          message: form.message.trim(),
          website: form.website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setErrors({
          form:
            payload?.error ||
            "We could not send your message. Please email supportlexora@gmail.com directly.",
        });
        return;
      }

      setSuccessMessage(
        payload.message ||
          "Your message was sent to Lexora Support. We usually reply within 24 hours.",
      );
      setForm((prev) => ({
        ...prev,
        issueType: "",
        message: "",
        website: "",
        name: session?.user.user_metadata?.full_name || prev.name,
        email: session?.user.email || prev.email,
      }));
    } catch (error) {
      console.error("Support form submit error:", error);
      setErrors({
        form:
          "Network error while sending your message. Please email supportlexora@gmail.com directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenMailApp() {
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSuccessMessage(null);
      return;
    }

    window.location.href = buildMailtoHref(form);
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
        .lexora-support-btn:hover:not(:disabled) {
          filter: brightness(1.04);
        }
        .lexora-support-link:hover {
          color: #5b21b6;
        }
        .lexora-support-faq:hover {
          background: #faf5ff;
        }
        .lexora-support-btn:focus-visible,
        .lexora-support-link:focus-visible,
        .lexora-support-faq:focus-visible,
        .lexora-support-input:focus-visible,
        .lexora-support-select:focus-visible,
        .lexora-support-textarea:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/support"
        onLogout={session ? handleLogout : undefined}
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
          onLogout={session ? handleLogout : undefined}
          activePath="/support"
        />

        <div
          style={{
            ...contentPad,
            padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
          }}
        >
          <header style={hero}>
            <span style={heroBadge}>
              <LifeBuoy size={14} aria-hidden />
              Support Center
            </span>
            <h1 style={{ ...title, fontSize: isMobile ? "30px" : "38px" }}>
              How can we help?
            </h1>
            <p style={subtitle}>
              Send a message to Lexora Support or email us directly. We usually
              reply within 24 hours.
            </p>
          </header>

          <section
            style={{
              ...infoGrid,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            }}
            aria-label="Support overview"
          >
            <article style={infoCard}>
              <Mail size={20} color="#7c3aed" aria-hidden />
              <h2 style={infoTitle}>Email</h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="lexora-support-link"
                style={emailLink}
              >
                {SUPPORT_EMAIL}
              </a>
            </article>

            <article style={infoCard}>
              <Clock size={20} color="#16a34a" aria-hidden />
              <h2 style={infoTitle}>Response time</h2>
              <p style={infoText}>Usually within about 24 hours</p>
            </article>

            <article style={infoCard}>
              <MessageCircle size={20} color="#2563eb" aria-hidden />
              <h2 style={infoTitle}>What to include</h2>
              <p style={infoText}>
                Account email, plan details, and steps to reproduce the issue
              </p>
            </article>
          </section>

          <section
            style={{
              ...mainGrid,
              gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
            }}
          >
            <div style={panel}>
              <div style={panelHeader}>
                <Send size={18} color="#7c3aed" aria-hidden />
                <h2 style={panelTitle}>Send a message</h2>
              </div>

              <p style={panelIntro}>
                Messages are delivered to{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="lexora-support-link"
                  style={inlineLink}
                >
                  {SUPPORT_EMAIL}
                </a>
                .
                {authLoading
                  ? " Loading your account details..."
                  : session
                    ? " Your account email is filled in where available."
                    : " You can contact us without signing in."}
              </p>

              <form onSubmit={handleSubmit} noValidate style={formGrid}>
                <div style={fieldBlock}>
                  <label htmlFor="support-name" style={label}>
                    Name
                  </label>
                  <input
                    id="support-name"
                    className="lexora-support-input"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    style={errors.name ? inputError : input}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "support-name-error" : undefined}
                  />
                  {errors.name ? (
                    <p id="support-name-error" style={fieldError} role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div style={fieldBlock}>
                  <label htmlFor="support-email" style={label}>
                    Email
                  </label>
                  <input
                    id="support-email"
                    className="lexora-support-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    style={errors.email ? inputError : input}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "support-email-error" : undefined
                    }
                  />
                  {errors.email ? (
                    <p id="support-email-error" style={fieldError} role="alert">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div style={fieldBlock}>
                  <label htmlFor="support-issue" style={label}>
                    Issue type
                  </label>
                  <select
                    id="support-issue"
                    className="lexora-support-select"
                    name="issueType"
                    value={form.issueType}
                    onChange={(event) =>
                      updateField(
                        "issueType",
                        event.target.value as IssueType,
                      )
                    }
                    style={errors.issueType ? inputError : input}
                    aria-invalid={Boolean(errors.issueType)}
                    aria-describedby={
                      errors.issueType ? "support-issue-error" : undefined
                    }
                  >
                    <option value="">Choose issue type</option>
                    {ISSUE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.issueType ? (
                    <p id="support-issue-error" style={fieldError} role="alert">
                      {errors.issueType}
                    </p>
                  ) : null}
                </div>

                <div style={fieldBlock}>
                  <label htmlFor="support-message" style={label}>
                    Message
                  </label>
                  <textarea
                    id="support-message"
                    className="lexora-support-textarea"
                    name="message"
                    rows={7}
                    value={form.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    style={{
                      ...(errors.message ? inputError : input),
                      resize: "vertical",
                      minHeight: "140px",
                    }}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "support-message-error" : undefined
                    }
                    placeholder="Describe what happened, what you expected, and any useful account or billing details."
                  />
                  {errors.message ? (
                    <p
                      id="support-message-error"
                      style={fieldError}
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  ) : null}
                </div>

                {/* Honeypot — hidden from assistive tech and users */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-10000px",
                    top: "auto",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                  }}
                >
                  <label htmlFor="support-website">Website</label>
                  <input
                    id="support-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(event) =>
                      updateField("website", event.target.value)
                    }
                  />
                </div>

                {errors.form ? (
                  <div style={errorBox} role="alert">
                    <AlertCircle size={16} aria-hidden />
                    <div>
                      <p style={statusText}>{errors.form}</p>
                      <p style={statusHint}>
                        You can also{" "}
                        <button
                          type="button"
                          className="lexora-support-link"
                          onClick={handleOpenMailApp}
                          style={textButton}
                        >
                          open your email app
                        </button>{" "}
                        or{" "}
                        <a
                          href={gmailComposeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lexora-support-link"
                          style={inlineLink}
                        >
                          compose in Gmail
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                ) : null}

                {successMessage ? (
                  <div style={successBox} role="status">
                    <CheckCircle2 size={16} aria-hidden />
                    <p style={statusText}>{successMessage}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="lexora-support-btn"
                  disabled={isSubmitting}
                  style={{
                    ...primaryButton,
                    opacity: isSubmitting ? 0.75 : 1,
                    cursor: isSubmitting ? "wait" : "pointer",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>

                <div
                  style={{
                    ...secondaryActions,
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  }}
                >
                  <button
                    type="button"
                    className="lexora-support-btn"
                    onClick={handleOpenMailApp}
                    style={secondaryButton}
                  >
                    <Mail size={16} aria-hidden />
                    Open email app
                  </button>
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lexora-support-btn"
                    style={secondaryButton}
                  >
                    <Mail size={16} aria-hidden />
                    Open Gmail
                  </a>
                </div>
              </form>
            </div>

            <div style={panel}>
              <div style={panelHeader}>
                <HelpCircle size={18} color="#7c3aed" aria-hidden />
                <h2 style={panelTitle}>Frequently asked questions</h2>
              </div>

              <div style={faqList}>
                {FAQ_ITEMS.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  const panelId = `support-faq-panel-${index}`;
                  const buttonId = `support-faq-button-${index}`;

                  return (
                    <div key={item.question} style={faqItem}>
                      <button
                        id={buttonId}
                        type="button"
                        className="lexora-support-faq"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() =>
                          setOpenFaqIndex(isOpen ? null : index)
                        }
                        style={faqButton}
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          size={18}
                          aria-hidden
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s ease",
                            flexShrink: 0,
                          }}
                        />
                      </button>
                      {isOpen ? (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          style={faqAnswer}
                        >
                          {item.answer}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
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

const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#faf5ff",
  color: "#6d28d9",
  border: "1px solid #e9d5ff",
  borderRadius: "999px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: 600 as const,
  marginBottom: "12px",
};

const title = {
  margin: "0 0 10px",
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
  maxWidth: "640px",
};

const infoGrid = {
  display: "grid",
  gap: "14px",
  marginBottom: "22px",
};

const infoCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const infoTitle = {
  margin: "10px 0 6px",
  fontSize: "16px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const infoText = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const emailLink = {
  color: "#6d28d9",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600 as const,
  wordBreak: "break-all" as const,
};

const mainGrid = {
  display: "grid",
  gap: "18px",
  alignItems: "start",
};

const panel = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "22px 18px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box" as const,
  position: "relative" as const,
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
};

const panelTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const panelIntro = {
  margin: "0 0 18px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const formGrid = {
  display: "grid",
  gap: "14px",
};

const fieldBlock = {
  display: "grid",
  gap: "6px",
};

const label = {
  fontSize: "14px",
  fontWeight: 600 as const,
  color: "#334155",
};

const input = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid #dbe3ef",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box" as const,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
};

const inputError = {
  ...input,
  border: "1px solid #fca5a5",
  background: "#fff7f7",
};

const fieldError = {
  margin: 0,
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.4,
};

const primaryButton = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontWeight: 700 as const,
  fontSize: "15px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryActions = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const secondaryButton = {
  minHeight: "44px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 600 as const,
  fontSize: "13px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  textDecoration: "none",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

const errorBox = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "12px",
  padding: "12px 14px",
  color: "#991b1b",
};

const successBox = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "12px",
  padding: "12px 14px",
  color: "#166534",
};

const statusText = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.5,
};

const statusHint = {
  margin: "6px 0 0",
  fontSize: "13px",
  lineHeight: 1.5,
};

const inlineLink = {
  color: "#6d28d9",
  textDecoration: "none",
  fontWeight: 600 as const,
};

const textButton = {
  ...inlineLink,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  font: "inherit",
};

const faqList = {
  display: "grid",
  gap: "8px",
};

const faqItem = {
  border: "1px solid #e8eaf0",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#fafbfc",
};

const faqButton = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "14px 14px",
  border: "none",
  background: "transparent",
  color: "#0f172a",
  fontWeight: 600 as const,
  fontSize: "14px",
  textAlign: "left" as const,
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.4,
};

const faqAnswer = {
  padding: "0 14px 14px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};
