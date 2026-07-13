import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "supportlexora@gmail.com";
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;

const ISSUE_TYPES = [
  "billing",
  "technical",
  "account",
  "general",
] as const;

type IssueType = (typeof ISSUE_TYPES)[number];

type SupportPayload = {
  name?: unknown;
  email?: unknown;
  issueType?: unknown;
  message?: unknown;
  website?: unknown; // honeypot
};

const ISSUE_LABELS: Record<IssueType, string> = {
  billing: "Billing issue",
  technical: "Technical problem",
  account: "Account support",
  general: "General question",
};

const recentSubmissions = new Map<string, number[]>();

function isIssueType(value: string): value is IssueType {
  return (ISSUE_TYPES as readonly string[]).includes(value);
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 5;
  const timestamps = (recentSubmissions.get(clientKey) || []).filter(
    (time) => now - time < windowMs,
  );

  if (timestamps.length >= maxRequests) {
    recentSubmissions.set(clientKey, timestamps);
    return true;
  }

  timestamps.push(now);
  recentSubmissions.set(clientKey, timestamps);
  return false;
}

export async function POST(request: Request) {
  let body: SupportPayload;

  try {
    body = (await request.json()) as SupportPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  // Silent honeypot success — do not tip off bots.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({
      ok: true,
      message: "Message received.",
    });
  }

  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      {
        error:
          "Too many support requests from this network. Please wait a few minutes, or email supportlexora@gmail.com directly.",
      },
      { status: 429 },
    );
  }

  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 200).toLowerCase();
  const issueTypeRaw = cleanText(body.issueType, 40).toLowerCase();
  const message = cleanText(body.message, 4000);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!isIssueType(issueTypeRaw)) {
    return NextResponse.json(
      { error: "Please choose a valid issue type." },
      { status: 400 },
    );
  }

  if (message.length < 20) {
    return NextResponse.json(
      {
        error:
          "Please describe your issue in a bit more detail (at least 20 characters).",
      },
      { status: 400 },
    );
  }

  const issueLabel = ISSUE_LABELS[issueTypeRaw];
  const subject = `Lexora Support — ${issueLabel}`;
  const composedMessage = [
    `Name: ${name}`,
    `Reply-to email: ${email}`,
    `Issue type: ${issueLabel}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const response = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        _replyto: email,
        _subject: subject,
        _template: "table",
        _captcha: "false",
        message: composedMessage,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { success?: string | boolean; message?: string }
      | null;

    const reportedSuccess =
      payload?.success === true ||
      payload?.success === "true" ||
      (typeof payload?.message === "string" &&
        /sent|success|thank/i.test(payload.message));

    if (!response.ok || !reportedSuccess) {
      console.error("Support email delivery failed:", {
        status: response.status,
        payload,
      });

      return NextResponse.json(
        {
          error:
            "We could not deliver your message right now. Please email supportlexora@gmail.com directly.",
          fallbackEmail: SUPPORT_EMAIL,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Your message was sent to Lexora Support. We usually reply within 24 hours.",
    });
  } catch (error) {
    console.error("Support email request error:", error);
    return NextResponse.json(
      {
        error:
          "We could not reach the mail service. Please email supportlexora@gmail.com directly.",
        fallbackEmail: SUPPORT_EMAIL,
      },
      { status: 502 },
    );
  }
}
