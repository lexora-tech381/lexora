import { NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const PAID_PLANS = ["silver", "gold", "premium"] as const;
type PaidPlanId = (typeof PAID_PLANS)[number];
type PlanId = PaidPlanId | "free";
type BillingCycle = "monthly" | "yearly";

const HANDLED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.canceled",
]);

type SubscriptionRow = {
  user_id: string;
  plan: PlanId;
  status: string;
  billing_cycle: BillingCycle;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

function isPaidPlanId(value: unknown): value is PaidPlanId {
  return (
    typeof value === "string" &&
    (PAID_PLANS as readonly string[]).includes(value)
  );
}

function getProductPlanMap(): Record<string, PaidPlanId> {
  const entries: Array<[string | undefined, PaidPlanId]> = [
    [process.env.POLAR_SILVER_MONTHLY_PRODUCT_ID?.trim(), "silver"],
    [process.env.POLAR_SILVER_YEARLY_PRODUCT_ID?.trim(), "silver"],
    [process.env.POLAR_GOLD_MONTHLY_PRODUCT_ID?.trim(), "gold"],
    [process.env.POLAR_GOLD_YEARLY_PRODUCT_ID?.trim(), "gold"],
    [process.env.POLAR_PREMIUM_MONTHLY_PRODUCT_ID?.trim(), "premium"],
    [process.env.POLAR_PREMIUM_YEARLY_PRODUCT_ID?.trim(), "premium"],
  ];

  const map: Record<string, PaidPlanId> = {};
  for (const [productId, plan] of entries) {
    if (productId) {
      map[productId] = plan;
    }
  }
  return map;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function resolveUserId(subscription: Subscription): string | null {
  const externalId = subscription.customer?.externalId?.trim();
  if (externalId) {
    return externalId;
  }

  const metadataUserId = subscription.metadata?.user_id;
  if (typeof metadataUserId === "string" && metadataUserId.trim()) {
    return metadataUserId.trim();
  }

  return null;
}

function resolvePaidPlan(subscription: Subscription): PaidPlanId | null {
  // Prefer checkout metadata when present so colliding product IDs cannot
  // overwrite the plan the user actually selected.
  const metadataPlan = subscription.metadata?.plan;
  if (isPaidPlanId(metadataPlan)) {
    return metadataPlan;
  }

  const productMap = getProductPlanMap();
  const productPlan = productMap[subscription.productId];
  if (productPlan) {
    return productPlan;
  }

  return null;
}

function resolvePlan(eventType: string, subscription: Subscription): PlanId {
  const status = String(subscription.status || "").toLowerCase();
  const isCanceledEvent = eventType === "subscription.canceled";
  const isActiveEvent = eventType === "subscription.active";
  const isCanceledStatus =
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired";
  const isActiveStatus = status === "active" || status === "trialing";

  if (isCanceledEvent || isCanceledStatus) {
    return "free";
  }

  if (isActiveEvent || isActiveStatus) {
    return resolvePaidPlan(subscription) || "free";
  }

  // Payment may still be pending on created/updated.
  return resolvePaidPlan(subscription) || "free";
}

function resolveBillingCycle(subscription: Subscription): BillingCycle {
  const metadataBilling = subscription.metadata?.billing;
  if (metadataBilling === "monthly" || metadataBilling === "yearly") {
    return metadataBilling;
  }

  const interval = String(subscription.recurringInterval || "").toLowerCase();
  if (interval === "year") {
    return "yearly";
  }

  return "monthly";
}

function buildSubscriptionRow(
  eventType: string,
  subscription: Subscription,
  userId: string,
): SubscriptionRow {
  const status = String(subscription.status || "").toLowerCase();

  return {
    user_id: userId,
    plan: resolvePlan(eventType, subscription),
    status: status || (eventType === "subscription.canceled" ? "canceled" : "unknown"),
    billing_cycle: resolveBillingCycle(subscription),
    polar_customer_id: subscription.customerId || subscription.customer?.id || null,
    polar_subscription_id: subscription.id || null,
    polar_product_id: subscription.productId || null,
    current_period_start: toIsoDate(subscription.currentPeriodStart),
    current_period_end: toIsoDate(subscription.currentPeriodEnd),
    cancel_at_period_end: Boolean(subscription.cancelAtPeriodEnd),
    updated_at: new Date().toISOString(),
  };
}

async function upsertSubscriptionRow(
  row: SubscriptionRow,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const supabase = getSupabaseAdminClient();

  // Prefer one row per user. If that unique constraint is missing, fall back
  // to polar_subscription_id, then manual update/insert.
  const byUser = await supabase.from("subscriptions").upsert(row, {
    onConflict: "user_id",
  });

  if (!byUser.error) {
    return { ok: true };
  }

  console.error(
    "Polar webhook upsert by user_id failed, trying polar_subscription_id:",
    byUser.error,
  );

  if (row.polar_subscription_id) {
    const byPolarSub = await supabase.from("subscriptions").upsert(row, {
      onConflict: "polar_subscription_id",
    });

    if (!byPolarSub.error) {
      return { ok: true };
    }

    console.error(
      "Polar webhook upsert by polar_subscription_id failed:",
      byPolarSub.error,
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", row.user_id)
    .maybeSingle();

  if (lookupError) {
    console.error("Polar webhook subscription lookup failed:", lookupError);
    return {
      ok: false,
      status: 500,
      error: "Failed to look up subscription row.",
    };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(row)
      .eq("user_id", row.user_id);

    if (updateError) {
      console.error("Polar webhook subscription update failed:", updateError);
      return {
        ok: false,
        status: 500,
        error: "Failed to update subscription.",
      };
    }

    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("subscriptions")
    .insert(row);

  if (insertError) {
    console.error("Polar webhook subscription insert failed:", insertError);
    return {
      ok: false,
      status: 500,
      error: "Failed to insert subscription.",
    };
  }

  return { ok: true };
}

async function syncSubscriptionFromPolar(
  eventType: string,
  subscription: Subscription,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const userId = resolveUserId(subscription);

  if (!userId) {
    return {
      ok: false,
      status: 404,
      error: "No matching user found for Polar customer.",
    };
  }

  const row = buildSubscriptionRow(eventType, subscription, userId);
  return upsertSubscriptionRow(row);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is missing.");
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  let body: string;
  try {
    body = await req.text();
  } catch (error) {
    console.error("Polar webhook body read failed:", error);
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  let event;
  try {
    event = validateEvent(body, headersToRecord(req.headers), webhookSecret);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 403 },
      );
    }

    console.error("Polar webhook validation failed:", error);
    return NextResponse.json(
      { error: "Webhook validation failed." },
      { status: 400 },
    );
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true }, { status: 202 });
  }

  try {
    const subscription = event.data as Subscription;
    const result = await syncSubscriptionFromPolar(event.type, subscription);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        received: true,
        type: event.type,
        subscription_id: subscription.id,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("========== POLAR WEBHOOK ERROR ==========");
    console.error(error);

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
