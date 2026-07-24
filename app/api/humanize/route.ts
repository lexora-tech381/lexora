import { NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 12_000;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.BYPASS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Bypass API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, mode } = body as { text?: string; mode?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Please provide valid text to humanize." },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds character limit of ${MAX_TEXT_LENGTH}.` },
        { status: 400 }
      );
    }

    // Call a specialized third-party humanizer/bypass endpoint
    const apiResponse = await fetch("https://api.hixbypass.com/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: trimmedText,
        mode: mode || "balanced", // e.g., fast, balanced, aggressive
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to process text through bypass provider.");
    }

    const data = await apiResponse.json();
    // Adjust based on the specific provider's JSON response structure
    const resultText = data.result || data.output || data.text;

    if (!resultText) {
      return NextResponse.json(
        { error: "Received empty response from bypass provider." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: resultText.trim() });

  } catch (error: any) {
    console.error("========== BYPASS API ERROR ==========", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}