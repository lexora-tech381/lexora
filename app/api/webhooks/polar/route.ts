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

const HANDLED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.canceled",
]);

type ProfileUpdate = {
  plan: PlanId;
  subscription_status: string;
  subscription_id: string | null;
  customer_id: string | null;
  current_period_end: string | null;
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

function resolvePaidPlan(subscription: Subscription): PaidPlanId | null {
  const productMap = getProductPlanMap();
  const productPlan = productMap[subscription.productId];
  if (productPlan) {
    return productPlan;
  }

  const metadataPlan = subscription.metadata?.plan;
  if (isPaidPlanId(metadataPlan)) {
    return metadataPlan;
  }

  return null;
}

function resolveProfileUpdate(
  eventType: string,
  subscription: Subscription,
): ProfileUpdate {
  const status = String(subscription.status || "").toLowerCase();
  const isCanceledEvent = eventType === "subscription.canceled";
  const isActiveEvent = eventType === "subscription.active";
  const isCanceledStatus =
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired";
  const isActiveStatus = status === "active" || status === "trialing";

  let plan: PlanId = "free";

  if (isCanceledEvent || isCanceledStatus) {
    plan = "free";
  } else if (isActiveEvent || isActiveStatus) {
    plan = resolvePaidPlan(subscription) || "free";
  } else {
    // created/updated while payment is still pending: keep free until active
    plan = "free";
  }

  return {
    plan,
    subscription_status: status || (isCanceledEvent ? "canceled" : "unknown"),
    subscription_id: subscription.id || null,
    customer_id: subscription.customerId || subscription.customer?.id || null,
    current_period_end: toIsoDate(subscription.currentPeriodEnd),
    updated_at: new Date().toISOString(),
  };
}

async function findProfileUserId(
  subscription: Subscription,
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const externalId =
    subscription.customer?.externalId?.trim() ||
    (typeof subscription.metadata?.user_id === "string"
      ? subscription.metadata.user_id.trim()
      : "") ||
    "";
  const email = subscription.customer?.email?.trim().toLowerCase() || "";

  if (externalId) {
    const { data: byId, error: byIdError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", externalId)
      .maybeSingle();

    if (byIdError) {
      console.error("Polar webhook profile lookup by id failed:", byIdError);
    } else if (byId?.id) {
      return byId.id;
    }
  }

  if (email) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (byEmailError) {
      console.error(
        "Polar webhook profile lookup by email failed:",
        byEmailError,
      );
    } else if (byEmail?.id) {
      return byEmail.id;
    }
  }

  // Checkout sets externalCustomerId to the Supabase user id.
  // If the profile row is missing, still attempt an update by that id.
  return externalId || null;
}

async function updateProfileForSubscription(
  eventType: string,
  subscription: Subscription,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const userId = await findProfileUserId(subscription);

  if (!userId) {
    return {
      ok: false,
      status: 404,
      error: "No matching user found for Polar customer.",
    };
  }

  const payload = resolveProfileUpdate(eventType, subscription);
  const email = subscription.customer?.email?.trim().toLowerCase() || null;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...(email ? { email } : {}),
      ...payload,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Polar webhook profile upsert failed:", error);
    return {
      ok: false,
      status: 500,
      error: "Failed to update profile.",
    };
  }

  return { ok: true };
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
    const result = await updateProfileForSubscription(event.type, subscription);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
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
