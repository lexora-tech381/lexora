import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let user;

  try {
    user = await getAuthenticatedUser(req);
  } catch (error) {
    console.error("Billing portal auth setup error:", error);
    return NextResponse.json(
      { error: "We could not open the billing portal. Please try again." },
      { status: 500 },
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to manage your subscription." },
      { status: 401 },
    );
  }

  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!polarAccessToken) {
    console.error(
      "Billing portal configuration error: POLAR_ACCESS_TOKEN is missing.",
    );
    return NextResponse.json(
      { error: "We could not open the billing portal. Please try again." },
      { status: 500 },
    );
  }

  const origin = new URL(req.url).origin;

  try {
    const polar = new Polar({ accessToken: polarAccessToken });
    const session = await polar.customerSessions.create({
      externalCustomerId: user.id,
      returnUrl: `${origin}/settings`,
    });

    if (!session.customerPortalUrl) {
      console.error("Polar customer session created without a portal URL.");
      return NextResponse.json(
        { error: "We could not open the billing portal. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.redirect(session.customerPortalUrl);
  } catch (error) {
    console.error("Polar customer portal session failed:", error);
    return NextResponse.json(
      { error: "We could not open the billing portal. Please try again." },
      { status: 500 },
    );
  }
}
