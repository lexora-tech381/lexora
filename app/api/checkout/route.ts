import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const PLANS = ["silver", "gold", "premium"] as const;
const BILLING_CYCLES = ["monthly", "yearly"] as const;

type PlanId = (typeof PLANS)[number];
type BillingCycle = (typeof BILLING_CYCLES)[number];

type CheckoutRequestBody = {
  plan?: unknown;
  billing?: unknown;
};

type ProductIdMap = Record<PlanId, Record<BillingCycle, string | undefined>>;

function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return (
    typeof value === "string" &&
    (BILLING_CYCLES as readonly string[]).includes(value)
  );
}

function getProductIdMap(): ProductIdMap {
  return {
    silver: {
      monthly: process.env.POLAR_SILVER_MONTHLY_PRODUCT_ID?.trim() || undefined,
      yearly: process.env.POLAR_SILVER_YEARLY_PRODUCT_ID?.trim() || undefined,
    },
    gold: {
      monthly: process.env.POLAR_GOLD_MONTHLY_PRODUCT_ID?.trim() || undefined,
      yearly: process.env.POLAR_GOLD_YEARLY_PRODUCT_ID?.trim() || undefined,
    },
    premium: {
      monthly: process.env.POLAR_PREMIUM_MONTHLY_PRODUCT_ID?.trim() || undefined,
      yearly: process.env.POLAR_PREMIUM_YEARLY_PRODUCT_ID?.trim() || undefined,
    },
  };
}

export async function POST(req: Request) {
  let body: CheckoutRequestBody;

  try {
    body = (await req.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isPlanId(body.plan) || !isBillingCycle(body.billing)) {
    return NextResponse.json(
      { error: "Invalid plan or billing option." },
      { status: 400 },
    );
  }

  const plan = body.plan;
  const billing = body.billing;

  const productId = getProductIdMap()[plan][billing];
  if (!productId) {
    return NextResponse.json(
      { error: "This billing option is not available." },
      { status: 400 },
    );
  }

  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch (error) {
    console.error("Checkout auth setup error:", error);
    return NextResponse.json(
      { error: "We could not create the checkout. Please try again." },
      { status: 500 },
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in before choosing a paid plan." },
      { status: 401 },
    );
  }

  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!polarAccessToken) {
    console.error("Checkout configuration error: POLAR_ACCESS_TOKEN is missing.");
    return NextResponse.json(
      { error: "We could not create the checkout. Please try again." },
      { status: 500 },
    );
  }

  const origin = new URL(req.url).origin;

  try {
    const polar = new Polar({ accessToken: polarAccessToken });
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email ?? undefined,
      externalCustomerId: user.id,
      metadata: {
        user_id: user.id,
        plan,
        billing,
      },
      successUrl: `${origin}/dashboard?checkout=success`,
      returnUrl: `${origin}/pricing?checkout=cancelled`,
    });

    if (!checkout.url) {
      console.error("Polar checkout created without a URL.");
      return NextResponse.json(
        { error: "We could not create the checkout. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Polar checkout creation failed:", error);
    return NextResponse.json(
      { error: "We could not create the checkout. Please try again." },
      { status: 500 },
    );
  }
}
