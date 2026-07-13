"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";

type PlanId = "silver" | "gold" | "premium";
type BillingCycle = "monthly" | "yearly";

const PLAN_IDS: readonly PlanId[] = ["silver", "gold", "premium"];
const BILLING_CYCLES: readonly BillingCycle[] = ["monthly", "yearly"];

const POLAR_CHECKOUT = {
  silverMonthly:
    "https://buy.polar.sh/polar_cl_A7Nr0bKmhPcczc9dMY1ZTgA8z13e6ggrmuLxk1cj5Ab",
  goldMonthly:
    "https://buy.polar.sh/polar_cl_GbQaVEWBGt7jhATZjNFVdiarBKQlf6jvL613J3XSKAW",
  premiumMonthly:
    "https://buy.polar.sh/polar_cl_aqCr5DXtBm8ZlsWlWucMFte1AxjeIBu00EI0d2pgTWV",
} as const;

interface CheckoutPlan {
  id: PlanId;
  name: string;
  allowance: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCheckoutUrl: string;
  yearlyCheckoutUrl?: string;
}

const CHECKOUT_PLANS: Record<PlanId, CheckoutPlan> = {
  silver: {
    id: "silver",
    name: "Silver",
    allowance: "10,000 words per month",
    monthlyPrice: 2.99,
    yearlyPrice: 29,
    monthlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_SILVER_MONTHLY_URL,
      POLAR_CHECKOUT.silverMonthly,
    ),
    yearlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_SILVER_YEARLY_URL,
    ),
  },
  gold: {
    id: "gold",
    name: "Gold",
    allowance: "30,000 words per month",
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    monthlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_GOLD_MONTHLY_URL,
      POLAR_CHECKOUT.goldMonthly,
    ),
    yearlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_GOLD_YEARLY_URL,
    ),
  },
  premium: {
    id: "premium",
    name: "Premium",
    allowance: "60,000 words per month",
    monthlyPrice: 19.99,
    yearlyPrice: 189,
    monthlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_URL,
      POLAR_CHECKOUT.premiumMonthly,
    ),
    yearlyCheckoutUrl: getCheckoutUrl(
      process.env.NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_URL,
    ),
  },
};

function getCheckoutUrl(envValue: string | undefined, fallback: string): string;
function getCheckoutUrl(
  envValue: string | undefined,
  fallback?: string,
): string | undefined;
function getCheckoutUrl(
  envValue: string | undefined,
  fallback?: string,
): string | undefined {
  const fromEnv = envValue?.trim();
  if (fromEnv) return fromEnv;
  return fallback;
}

function isPlanId(value: string | null): value is PlanId {
  return value !== null && (PLAN_IDS as readonly string[]).includes(value);
}

function isBillingCycle(value: string | null): value is BillingCycle {
  return (
    value !== null && (BILLING_CYCLES as readonly string[]).includes(value)
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main style={page}>
          <div style={loadingCard}>Loading checkout...</div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const planParam = searchParams.get("plan");
  const billingParam = searchParams.get("billing");

  const validation = useMemo(() => {
    if (!isPlanId(planParam) || !isBillingCycle(billingParam)) {
      return { ok: false as const };
    }

    const plan = CHECKOUT_PLANS[planParam];
    const billing = billingParam;
    const checkoutUrl =
      billing === "yearly" ? plan.yearlyCheckoutUrl : plan.monthlyCheckoutUrl;
    const priceLabel =
      billing === "yearly"
        ? `${formatMoney(plan.yearlyPrice)}/year`
        : `${formatMoney(plan.monthlyPrice)}/month`;

    return {
      ok: true as const,
      plan,
      billing,
      checkoutUrl,
      priceLabel,
    };
  }, [planParam, billingParam]);

  function handleContinueToCheckout() {
    if (!validation.ok || !validation.checkoutUrl || isRedirecting) return;

    setIsRedirecting(true);
    window.location.assign(validation.checkoutUrl);
  }

  if (!validation.ok) {
    return (
      <main style={page}>
        <style>{checkoutFocusStyles}</style>
        <PublicChrome />
        <section style={shell}>
          <div style={card}>
            <h1 style={title}>Checkout unavailable</h1>
            <p style={bodyText}>
              This checkout link is missing a valid plan or billing cycle. Choose
              a paid plan from Pricing to continue.
            </p>
            <p style={hintText}>
              Valid plans: silver, gold, premium. Valid billing: monthly,
              yearly.
            </p>
            <Link href="/pricing" className="lexora-checkout-link" style={primaryButton}>
              Back to pricing
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { plan, billing, checkoutUrl, priceLabel } = validation;
  const isYearlyUnavailable = billing === "yearly" && !checkoutUrl;
  const isCheckoutMissing = !checkoutUrl;

  return (
    <main style={page}>
      <style>{checkoutFocusStyles}</style>
      <PublicChrome />

      <section style={shell}>
        <Link href="/pricing" className="lexora-checkout-link" style={backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to pricing
        </Link>

        <div style={card}>
          <div style={brandRow}>
            <Link href="/" className="lexora-checkout-link" style={brandLink}>
              Lexora
            </Link>
            <span style={secureBadge}>
              <Lock size={14} aria-hidden="true" />
              Polar checkout
            </span>
          </div>

          <h1 style={title}>Confirm your plan</h1>
          <p style={bodyText}>
            Review your selection, then continue to Polar’s secure hosted
            checkout to finish payment.
          </p>

          <div style={planBox}>
            <div>
              <p style={mutedLabel}>Selected plan</p>
              <p style={planName}>{plan.name}</p>
              <p style={mutedText}>{plan.allowance}</p>
            </div>
            <div style={planPriceBlock}>
              <p style={mutedLabel}>Billing</p>
              <p style={planName}>{priceLabel}</p>
              <p style={mutedText}>
                {billing === "yearly" ? "Yearly billing" : "Monthly billing"}
              </p>
            </div>
          </div>

          <div style={summaryBox} aria-label="Order summary">
            <div style={summaryRow}>
              <span>Plan</span>
              <strong>{plan.name}</strong>
            </div>
            <div style={summaryRow}>
              <span>Allowance</span>
              <strong>{plan.allowance}</strong>
            </div>
            <div style={summaryRow}>
              <span>Billing cycle</span>
              <strong>{billing === "yearly" ? "Yearly" : "Monthly"}</strong>
            </div>
            <div style={{ ...summaryRow, borderBottom: "none" }}>
              <span>Total due today</span>
              <strong>{priceLabel}</strong>
            </div>
          </div>

          {isYearlyUnavailable ? (
            <div style={noticeBox} role="status">
              <p style={noticeTitle}>Yearly billing coming soon</p>
              <p style={noticeText}>
                Yearly checkout is not available for {plan.name} yet. Choose
                monthly billing on the Pricing page, or check back later.
              </p>
              <Link
                href="/pricing"
                className="lexora-checkout-link"
                style={secondaryButton}
              >
                Choose another option
              </Link>
            </div>
          ) : isCheckoutMissing ? (
            <div style={noticeBox} role="alert">
              <p style={noticeTitle}>Checkout temporarily unavailable</p>
              <p style={noticeText}>
                A Polar checkout link is not available for this plan right now.
                Please try again later from Pricing.
              </p>
              <Link
                href="/pricing"
                className="lexora-checkout-link"
                style={secondaryButton}
              >
                Back to pricing
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleContinueToCheckout}
                disabled={isRedirecting}
                style={{
                  ...primaryButton,
                  opacity: isRedirecting ? 0.75 : 1,
                  cursor: isRedirecting ? "wait" : "pointer",
                }}
              >
                {isRedirecting ? "Opening Polar..." : "Continue to secure checkout"}
                {!isRedirecting ? (
                  <ExternalLink size={16} aria-hidden="true" />
                ) : null}
              </button>
              <p style={safeNote}>
                Payment details will be entered securely on Polar’s checkout
                page.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PublicChrome() {
  return (
    <header style={publicHeader}>
      <div style={headerInner}>
        <Link href="/" className="lexora-checkout-link" style={brandLink}>
          Lexora
        </Link>
        <nav style={headerNav} aria-label="Checkout navigation">
          <Link href="/pricing" className="lexora-checkout-link" style={navLink}>
            Pricing
          </Link>
          <Link href="/support" className="lexora-checkout-link" style={navLink}>
            Support
          </Link>
        </nav>
      </div>
    </header>
  );
}

const checkoutFocusStyles = `
  .lexora-checkout-link:hover {
    color: #5b21b6;
  }
  .lexora-checkout-link:focus-visible,
  button:focus-visible {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
  @media (min-width: 768px) {
    .lexora-checkout-card {
      padding: 40px !important;
    }
  }
`;

const page = {
  minHeight: "100vh",
  backgroundImage:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  backgroundColor: "#f8fafc",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  color: "#0f172a",
  display: "flex",
  flexDirection: "column" as const,
};

const publicHeader = {
  borderBottom: "1px solid #e8eaf0",
  background: "rgba(248, 250, 252, 0.92)",
  backdropFilter: "blur(8px)",
  position: "sticky" as const,
  top: 0,
  zIndex: 20,
};

const headerInner = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  boxSizing: "border-box" as const,
};

const brandLink = {
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 800 as const,
  fontSize: "20px",
  letterSpacing: "-0.03em",
};

const headerNav = {
  display: "flex",
  gap: "8px 14px",
  flexWrap: "wrap" as const,
};

const navLink = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500 as const,
  minHeight: "40px",
  display: "inline-flex",
  alignItems: "center",
};

const shell = {
  width: "100%",
  maxWidth: "720px",
  margin: "0 auto",
  padding: "20px 16px 40px",
  boxSizing: "border-box" as const,
  flex: 1,
};

const loadingCard = {
  ...shell,
  color: "#64748b",
  fontSize: "15px",
};

const backLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#6d28d9",
  textDecoration: "none",
  fontWeight: 600 as const,
  fontSize: "14px",
  marginBottom: "16px",
  minHeight: "40px",
};

const card = {
  width: "100%",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px 18px",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e2e8f0",
  boxSizing: "border-box" as const,
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
};

const secureBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#faf5ff",
  color: "#6d28d9",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600 as const,
  border: "1px solid #e9d5ff",
};

const title = {
  margin: "0 0 10px",
  fontSize: "28px",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.2,
};

const bodyText = {
  margin: "0 0 22px",
  color: "#475569",
  fontSize: "16px",
  lineHeight: 1.6,
};

const hintText = {
  margin: "0 0 20px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const planBox = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  background: "#faf5ff",
  border: "1px solid #e9d5ff",
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "18px",
  flexWrap: "wrap" as const,
};

const planPriceBlock = {
  textAlign: "right" as const,
  minWidth: "140px",
};

const mutedLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
};

const planName = {
  margin: "4px 0",
  fontSize: "20px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const mutedText = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};

const summaryBox = {
  border: "1px solid #e8eaf0",
  borderRadius: "14px",
  padding: "8px 16px",
  marginBottom: "22px",
  background: "#fafbfc",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
  color: "#475569",
  fontSize: "15px",
  flexWrap: "wrap" as const,
};

const primaryButton = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 700 as const,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  textDecoration: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

const secondaryButton = {
  ...primaryButton,
  background: "#ffffff",
  color: "#6d28d9",
  border: "1px solid #ddd6fe",
  marginTop: "12px",
};

const safeNote = {
  margin: "14px 0 0",
  textAlign: "center" as const,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const noticeBox = {
  border: "1px solid #fde68a",
  background: "#fffbeb",
  borderRadius: "14px",
  padding: "16px",
};

const noticeTitle = {
  margin: "0 0 6px",
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#92400e",
};

const noticeText = {
  margin: 0,
  color: "#78350f",
  fontSize: "14px",
  lineHeight: 1.5,
};
