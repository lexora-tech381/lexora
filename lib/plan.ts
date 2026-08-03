export const PLAN_IDS = ["free", "silver", "gold", "premium"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

type PlanDetails = {
  id: PlanId;
  name: string;
  allowanceLabel: string;
  features: string[];
};

const PLAN_DETAILS: Record<PlanId, PlanDetails> = {
  free: {
    id: "free",
    name: "Free",
    allowanceLabel: "10 rewrites per day",
    features: [
      "10 rewrites per day",
      "Free rewrite mode",
      "Standard processing",
      "Saved documents",
    ],
  },
  silver: {
    id: "silver",
    name: "Silver",
    allowanceLabel: "10,000 words per month",
    features: [
      "10,000 words per month",
      "Standard rewrite modes",
      "Faster processing",
      "Email support",
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    allowanceLabel: "30,000 words per month",
    features: [
      "30,000 words per month",
      "Advanced rewrite modes",
      "Faster processing",
      "Priority support",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    allowanceLabel: "60,000 words per month",
    features: [
      "60,000 words per month",
      "All available rewrite modes",
      "Fastest available processing",
      "Priority support",
      "Early access to selected features",
    ],
  },
};

export function normalizePlanId(value: unknown): PlanId {
  if (typeof value !== "string") {
    return "free";
  }

  const normalized = value.trim().toLowerCase();
  if ((PLAN_IDS as readonly string[]).includes(normalized)) {
    return normalized as PlanId;
  }

  return "free";
}

export function getPlanDetails(plan: PlanId | unknown): PlanDetails {
  return PLAN_DETAILS[normalizePlanId(plan)];
}

export function formatPlanName(plan: PlanId | unknown): string {
  return getPlanDetails(plan).name;
}

/** Free plan still uses a daily rewrite cap in the current product UX. */
export function getDailyRewriteLimit(plan: PlanId | unknown): number {
  return normalizePlanId(plan) === "free" ? 10 : 999999;
}
