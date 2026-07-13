"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Check,
  Star,
  ListChecks,
  CalendarRange,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";

type BillingCycle = "monthly" | "yearly";

interface PricingPlan {
  id: "free" | "silver" | "gold" | "premium";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCheckoutUrl?: string;
  yearlyCheckoutUrl?: string;
  features: string[];
  allowance: string;
  modes: string;
  processing: string;
  support: string;
  popular?: boolean;
}

const planName = "Free";
const dailyLimit = 10;

// Future subscription integration point:
// Replace `null` with the verified plan id from billing/webhook data.
const currentPlanId: PricingPlan["id"] | null = null;

const POLAR_CHECKOUT = {
  silverMonthly:
    "https://buy.polar.sh/polar_cl_A7Nr0bKmhPcczc9dMY1ZTgA8z13e6ggrmuLxk1cj5Ab",
  goldMonthly:
    "https://buy.polar.sh/polar_cl_GbQaVEWBGt7jhATZjNFVdiarBKQlf6jvL613J3XSKAW",
  premiumMonthly:
    "https://buy.polar.sh/polar_cl_aqCr5DXtBm8ZlsWlWucMFte1AxjeIBu00EI0d2pgTWV",
} as const;

function getCheckoutUrl(
  envValue: string | undefined,
  fallback?: string,
): string | undefined {
  const fromEnv = envValue?.trim();
  if (fromEnv) return fromEnv;
  return fallback;
}

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

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getYearlySavings(monthlyPrice: number, yearlyPrice: number) {
  const annualMonthlyCost = monthlyPrice * 12;
  const yearlySavings = annualMonthlyCost - yearlyPrice;
  const yearlySavingsPercent =
    annualMonthlyCost > 0
      ? Math.round((yearlySavings / annualMonthlyCost) * 100)
      : 0;

  return {
    yearlySavings,
    yearlySavingsPercent,
    equivalentMonthly: yearlyPrice / 12,
    hasSavings: yearlySavings > 0 && yearlySavingsPercent > 0,
  };
}

function buildPlans(): PricingPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      description: "For trying Lexora and light everyday rewriting.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      allowance: "10 rewrites per day",
      modes: "Free rewrite mode",
      processing: "Standard processing",
      support: "Community help resources",
      features: [
        "10 rewrites per day",
        "Free rewrite mode",
        "Standard processing",
        "Save documents",
      ],
    },
    {
      id: "silver",
      name: "Silver",
      description: "For light monthly writing needs.",
      monthlyPrice: 2.99,
      yearlyPrice: 29,
      monthlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_SILVER_MONTHLY_URL,
        POLAR_CHECKOUT.silverMonthly,
      ),
      yearlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_SILVER_YEARLY_URL,
      ),
      allowance: "10,000 words per month",
      modes: "Standard rewrite modes",
      processing: "Faster processing",
      support: "Email support",
      features: [
        "10,000 words per month",
        "Standard rewrite modes",
        "Faster processing",
        "Email support",
      ],
    },
    {
      id: "gold",
      name: "Gold",
      description: "Best for regular students, creators, and freelancers.",
      monthlyPrice: 9.99,
      yearlyPrice: 99,
      popular: true,
      monthlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_GOLD_MONTHLY_URL,
        POLAR_CHECKOUT.goldMonthly,
      ),
      yearlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_GOLD_YEARLY_URL,
      ),
      allowance: "30,000 words per month",
      modes: "Advanced rewrite modes",
      processing: "Faster processing",
      support: "Priority support",
      features: [
        "30,000 words per month",
        "Advanced rewrite modes",
        "Faster processing",
        "Priority support",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      description: "For heavier professional writing workloads.",
      monthlyPrice: 19.99,
      yearlyPrice: 189,
      monthlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_URL,
        POLAR_CHECKOUT.premiumMonthly,
      ),
      yearlyCheckoutUrl: getCheckoutUrl(
        process.env.NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_URL,
      ),
      allowance: "60,000 words per month",
      modes: "All available rewrite modes",
      processing: "Fastest available processing",
      support: "Priority support",
      features: [
        "60,000 words per month",
        "All available rewrite modes",
        "Fastest available processing",
        "Priority support",
        "Early access to selected features",
      ],
    },
  ];
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [todayUsage, setTodayUsage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PricingPlan["id"] | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const plans = useMemo(() => buildPlans(), []);
  const isYearly = billing === "yearly";

  const maxYearlySavingsPercent = useMemo(() => {
    const percents = plans
      .filter((plan) => plan.id !== "free")
      .map(
        (plan) =>
          getYearlySavings(plan.monthlyPrice, plan.yearlyPrice)
            .yearlySavingsPercent,
      )
      .filter((value) => value > 0);
    return percents.length ? Math.max(...percents) : 0;
  }, [plans]);

  const hasAnyYearlyCheckout = plans.some(
    (plan) => plan.id !== "free" && Boolean(plan.yearlyCheckoutUrl),
  );

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1100);
    };
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
        console.error("Pricing session error:", error);
        setAuthLoading(false);
        return;
      }

      setSession(currentSession);

      if (currentSession) {
        const today = new Date().toISOString().split("T")[0];
        const { data: usage, error: usageError } = await supabase
          .from("usage")
          .select("count")
          .eq("user_id", currentSession.user.id)
          .eq("date", today)
          .maybeSingle();

        if (usageError) {
          console.error("Pricing usage error:", usageError);
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

  async function handlePlanSelection(plan: PricingPlan) {
    if (authLoading || selectedPlanId) return;

    setErrorMessage(null);
    setInfoMessage(null);

    if (plan.id === "free") {
      router.push("/");
      return;
    }

    if (!session) {
      router.push(`/signup?plan=${plan.id}&billing=${billing}`);
      return;
    }

    const checkoutUrl = isYearly
      ? plan.yearlyCheckoutUrl
      : plan.monthlyCheckoutUrl;

    if (!checkoutUrl) {
      if (isYearly) {
        setInfoMessage("Yearly billing will be available soon.");
      } else {
        setErrorMessage(
          "Checkout is temporarily unavailable for this plan. Please try again later.",
        );
      }
      return;
    }

    setSelectedPlanId(plan.id);
    window.location.href = checkoutUrl;
  }

  function getButtonLabel(plan: PricingPlan): string {
    if (selectedPlanId === plan.id) return "Opening checkout...";

    if (plan.id === "free") {
      return "Use Free Plan";
    }

    if (currentPlanId === plan.id) return "Current Plan";

    if (isYearly && !plan.yearlyCheckoutUrl) {
      return "Yearly Coming Soon";
    }

    if (isYearly && plan.yearlyCheckoutUrl) {
      return `Get ${plan.name}`;
    }

    return `Get ${plan.name}`;
  }

  const cardsColumns = isMobile
    ? "1fr"
    : isTablet
      ? "1fr 1fr"
      : "repeat(4, 1fr)";

  return (
    <main
      style={{
        ...pageShell,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        .lexora-pricing-btn:hover:not(:disabled) {
          filter: brightness(1.04);
        }
        .lexora-pricing-toggle:focus-visible,
        .lexora-pricing-btn:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/pricing"
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
        />

        <div
          style={{
            ...contentPad,
            padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
          }}
        >
          <header style={hero}>
            <span style={heroBadge}>
              <Star size={14} aria-hidden />
              Flexible pricing
            </span>

            <h1 style={{ ...title, fontSize: isMobile ? "30px" : "40px" }}>
              Choose the right plan for your writing
            </h1>

            <p style={subtitle}>
              Start free, then upgrade when you need more words, writing modes,
              or faster processing.
            </p>

            <p style={billingLabel} id="billing-cycle-label">
              Billing cycle
            </p>

            <div
              style={toggleWrapper}
              role="group"
              aria-labelledby="billing-cycle-label"
            >
              <button
                type="button"
                className="lexora-pricing-toggle"
                aria-pressed={billing === "monthly"}
                onClick={() => {
                  setBilling("monthly");
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                style={billing === "monthly" ? activeToggle : inactiveToggle}
              >
                Monthly
              </button>
              <button
                type="button"
                className="lexora-pricing-toggle"
                aria-pressed={billing === "yearly"}
                onClick={() => {
                  setBilling("yearly");
                  setErrorMessage(null);
                  setInfoMessage(
                    hasAnyYearlyCheckout
                      ? null
                      : "Yearly billing will be available soon.",
                  );
                }}
                style={billing === "yearly" ? activeToggle : inactiveToggle}
              >
                Yearly
              </button>
            </div>

            {isYearly && maxYearlySavingsPercent > 0 ? (
              <p style={saveText}>Save up to {maxYearlySavingsPercent}% with yearly billing where available.</p>
            ) : null}

            {isYearly && !hasAnyYearlyCheckout ? (
              <p style={infoNote}>Yearly billing will be available soon.</p>
            ) : null}
          </header>

          {errorMessage ? (
            <div style={errorBox} role="alert">
              <AlertCircle size={16} aria-hidden />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {infoMessage ? (
            <div style={infoBox} role="status">
              <span>{infoMessage}</span>
            </div>
          ) : null}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: cardsColumns,
              gap: isMobile ? "14px" : "16px",
              marginBottom: "28px",
              alignItems: "stretch",
            }}
          >
            {plans.map((plan) => {
              const savings = getYearlySavings(
                plan.monthlyPrice,
                plan.yearlyPrice,
              );
              const displayPrice = isYearly
                ? plan.yearlyPrice
                : plan.monthlyPrice;
              const priceSuffix = isYearly ? "per year" : "per month";
              const isCurrent = currentPlanId === plan.id;
              const checkoutUnavailable =
                plan.id !== "free" && isYearly && !plan.yearlyCheckoutUrl;
              const disabled =
                authLoading ||
                selectedPlanId === plan.id ||
                checkoutUnavailable ||
                isCurrent;

              return (
                <article
                  key={plan.id}
                  style={{
                    ...(plan.popular ? popularCard : card),
                    transform: "none",
                  }}
                >
                  {plan.popular ? (
                    <div style={popularBadge}>Most Popular</div>
                  ) : null}

                  {isYearly && plan.id !== "free" && savings.hasSavings ? (
                    <span style={savingsBadge}>Save {savings.yearlySavingsPercent}%</span>
                  ) : null}

                  <h2 style={planTitle}>{plan.name}</h2>
                  <p style={planDesc}>{plan.description}</p>

                  <div style={priceBlock}>
                    <p style={priceValue}>{formatMoney(displayPrice)}</p>
                    <p style={priceSuffixText}>{priceSuffix}</p>
                    {isYearly && plan.id !== "free" ? (
                      <p style={equivalentText}>
                        Equivalent to {formatMoney(savings.equivalentMonthly)}
                        /month
                      </p>
                    ) : null}
                  </div>

                  <div style={features}>
                    {plan.features.map((feature) => (
                      <p key={feature} style={featureItem}>
                        <Check size={16} color="#16a34a" aria-hidden />
                        <span>{feature}</span>
                      </p>
                    ))}
                  </div>

                  <div style={buttonArea}>
                    <button
                      type="button"
                      className="lexora-pricing-btn"
                      aria-label={getButtonLabel(plan)}
                      disabled={disabled}
                      onClick={() => handlePlanSelection(plan)}
                      style={{
                        ...(plan.popular ? popularButton : planButton),
                        opacity: disabled ? 0.65 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {getButtonLabel(plan)}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section style={comparisonSection}>
            <h2 style={sectionTitle}>Plan comparison</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                    ? "1fr 1fr"
                    : "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              {plans.map((plan) => (
                <div key={`${plan.id}-compare`} style={compareCard}>
                  <h3 style={compareName}>{plan.name}</h3>
                  <p style={compareRow}>
                    <strong>Allowance:</strong> {plan.allowance}
                  </p>
                  <p style={compareRow}>
                    <strong>Modes:</strong> {plan.modes}
                  </p>
                  <p style={compareRow}>
                    <strong>Processing:</strong> {plan.processing}
                  </p>
                  <p style={compareRow}>
                    <strong>Support:</strong> {plan.support}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <div style={trustCard}>
              <ListChecks color="#7c3aed" aria-hidden />
              <h3 style={trustTitle}>Clear Plan Limits</h3>
              <p style={mutedSmall}>
                See exactly how many words or rewrites are included in each plan.
              </p>
            </div>
            <div style={trustCard}>
              <CalendarRange color="#7c3aed" aria-hidden />
              <h3 style={trustTitle}>Flexible Billing</h3>
              <p style={mutedSmall}>
                Choose monthly billing, with yearly billing available where
                supported.
              </p>
            </div>
            <div style={trustCard}>
              <LifeBuoy color="#7c3aed" aria-hidden />
              <h3 style={trustTitle}>Account Support</h3>
              <p style={mutedSmall}>
                Contact support if you need help with billing or your
                subscription.
              </p>
            </div>
          </section>

          <section style={faqWrapper}>
            <h2 style={sectionTitle}>Frequently asked questions</h2>

            {[
              [
                "Can I cancel my subscription?",
                "Subscription management will be available from your account once billing integration is complete.",
              ],
              [
                "When do plan limits reset?",
                "Paid plan word limits reset at the start of each billing cycle. The Free plan resets daily.",
              ],
              [
                "What happens if I reach my limit?",
                "You can wait for the next reset period or upgrade to a higher plan for more capacity.",
              ],
              [
                "Can I change plans later?",
                "Yes. You can move to a different plan from this page when you are ready to upgrade.",
              ],
              [
                "Is yearly billing available?",
                hasAnyYearlyCheckout
                  ? "Yearly billing is available for plans that show a yearly checkout option."
                  : "Yearly billing will be available soon. Monthly checkout remains available now.",
              ],
              [
                "How do I get billing support?",
                "Visit the Support page or contact us if you need help with billing questions.",
              ],
            ].map(([question, answer]) => (
              <div key={question} style={faqBox}>
                <h3 style={faqQuestion}>{question}</h3>
                <p style={mutedSmall}>{answer}</p>
              </div>
            ))}
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
  width: "100%",
  minWidth: 0,
};

const contentPad = {
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
};

const hero = {
  textAlign: "center" as const,
  marginBottom: "28px",
};

const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#f5f3ff",
  color: "#6d28d9",
  padding: "7px 12px",
  borderRadius: "999px",
  fontWeight: 600 as const,
  fontSize: "12px",
  marginBottom: "16px",
};

const title = {
  margin: "0 auto 12px",
  maxWidth: "720px",
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const subtitle = {
  color: "#64748b",
  maxWidth: "640px",
  margin: "0 auto 22px",
  fontSize: "15px",
  lineHeight: 1.6,
};

const billingLabel = {
  margin: "0 0 10px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 600 as const,
};

const toggleWrapper = {
  display: "inline-flex",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "999px",
  padding: "5px",
  gap: "4px",
};

const activeToggle = {
  padding: "10px 20px",
  minHeight: "40px",
  borderRadius: "999px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "inherit",
};

const inactiveToggle = {
  ...activeToggle,
  background: "transparent",
  color: "#334155",
};

const saveText = {
  color: "#15803d",
  fontWeight: 600 as const,
  marginTop: "14px",
  fontSize: "14px",
};

const infoNote = {
  color: "#64748b",
  marginTop: "10px",
  fontSize: "13px",
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  lineHeight: 1.5,
};

const infoBox = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.5,
};

const card = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  minHeight: "100%",
  boxSizing: "border-box" as const,
};

const popularCard = {
  ...card,
  border: "2px solid #8b5cf6",
  boxShadow: "0 14px 34px rgba(124, 58, 237, 0.12)",
};

const popularBadge = {
  position: "absolute" as const,
  top: "-12px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#7c3aed",
  color: "white",
  padding: "5px 12px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600 as const,
  whiteSpace: "nowrap" as const,
};

const savingsBadge = {
  position: "absolute" as const,
  top: "14px",
  right: "14px",
  background: "#dcfce7",
  color: "#15803d",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600 as const,
};

const planTitle = {
  margin: "8px 0 6px",
  fontSize: "22px",
  fontWeight: 700 as const,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const planDesc = {
  margin: "0 0 16px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
  minHeight: "42px",
};

const priceBlock = {
  marginBottom: "18px",
};

const priceValue = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const priceSuffixText = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const equivalentText = {
  margin: "6px 0 0",
  color: "#7c3aed",
  fontSize: "12px",
  fontWeight: 600 as const,
};

const features = {
  display: "grid",
  gap: "10px",
  flex: 1,
  marginBottom: "20px",
};

const featureItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  color: "#334155",
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.45,
};

const buttonArea = {
  marginTop: "auto",
};

const planButton = {
  width: "100%",
  padding: "12px 14px",
  minHeight: "44px",
  borderRadius: "11px",
  border: "1px solid #e9d5ff",
  background: "#faf5ff",
  color: "#6d28d9",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "filter 0.15s ease, opacity 0.15s ease",
};

const popularButton = {
  ...planButton,
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
};

const comparisonSection = {
  marginBottom: "28px",
};

const sectionTitle = {
  textAlign: "center" as const,
  margin: "0 0 16px",
  fontSize: "22px",
  fontWeight: 700 as const,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

const compareCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "16px",
};

const compareName = {
  margin: "0 0 10px",
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const compareRow = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#475569",
  lineHeight: 1.45,
};

const trustCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "20px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};

const trustTitle = {
  margin: "12px 0 6px",
  fontSize: "16px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const faqWrapper = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
};

const faqBox = {
  borderTop: "1px solid #e8eaf0",
  padding: "16px 0",
};

const faqQuestion = {
  margin: "0 0 6px",
  fontSize: "15px",
  fontWeight: 600 as const,
  color: "#0f172a",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
  lineHeight: 1.55,
};
