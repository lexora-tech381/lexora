export const PLAN_IDS = ["free", "silver", "gold", "premium"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDetails = {
  id: PlanId;
  name: string;
  /** Free plan only. Paid plans use monthly word limits instead. */
  dailyRewriteLimit: number | null;
  /** Paid plans only. */
  monthlyWordLimit: number | null;
  allowanceLabel: string;
  features: string[];
};

const PLAN_DETAILS: Record<PlanId, PlanDetails> = {
  free: {
    id: "free",
    name: "Free",
    dailyRewriteLimit: 10,
    monthlyWordLimit: null,
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
    dailyRewriteLimit: null,
    monthlyWordLimit: 10_000,
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
    dailyRewriteLimit: null,
    monthlyWordLimit: 30_000,
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
    dailyRewriteLimit: null,
    monthlyWordLimit: 60_000,
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

export function isFreePlan(plan: PlanId | unknown): boolean {
  return normalizePlanId(plan) === "free";
}

export function getDailyRewriteLimit(plan: PlanId | unknown): number | null {
  return getPlanDetails(plan).dailyRewriteLimit;
}

export function getMonthlyWordLimit(plan: PlanId | unknown): number | null {
  return getPlanDetails(plan).monthlyWordLimit;
}

export function countWords(text: string | null | undefined): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function formatPlanNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** UTC start of the current calendar month (ISO). */
export function getCalendarMonthStartIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

export function formatPlanUsageLabel(
  plan: PlanId | unknown,
  usage: { dailyRewrites?: number; monthlyWords?: number } = {},
): string {
  const details = getPlanDetails(plan);

  if (details.dailyRewriteLimit != null) {
    const used = usage.dailyRewrites ?? 0;
    return `${used} / ${details.dailyRewriteLimit} uses today`;
  }

  const limit = details.monthlyWordLimit ?? 0;
  const used = usage.monthlyWords ?? 0;
  return `${formatPlanNumber(used)} / ${formatPlanNumber(limit)} words this month`;
}

export function formatRemainingAllowanceLabel(
  plan: PlanId | unknown,
  usage: { dailyRewrites?: number; monthlyWords?: number } = {},
): string {
  const details = getPlanDetails(plan);

  if (details.dailyRewriteLimit != null) {
    const remaining = Math.max(
      details.dailyRewriteLimit - (usage.dailyRewrites ?? 0),
      0,
    );
    return `${remaining} uses left today`;
  }

  const limit = details.monthlyWordLimit ?? 0;
  const remaining = Math.max(limit - (usage.monthlyWords ?? 0), 0);
  return `${formatPlanNumber(remaining)} words left this month`;
}

export function getRemainingAllowance(
  plan: PlanId | unknown,
  usage: { dailyRewrites?: number; monthlyWords?: number } = {},
): number {
  const details = getPlanDetails(plan);

  if (details.dailyRewriteLimit != null) {
    return Math.max(details.dailyRewriteLimit - (usage.dailyRewrites ?? 0), 0);
  }

  return Math.max(
    (details.monthlyWordLimit ?? 0) - (usage.monthlyWords ?? 0),
    0,
  );
}
