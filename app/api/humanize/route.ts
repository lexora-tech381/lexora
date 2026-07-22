import { NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 12_000;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.HUMANIZER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Humanizer API key is not configured in environment variables." },
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

    // Map your app's modes to Undetectable's valid readability options:
    // "High School", "University", "Doctorate", "Journalist", "Marketing"
    const readabilityMap: Record<string, string> = {
      Standard: "High School",
      Friendly: "University",
      Academic: "University",
      Professional: "Journalist",
      Simple: "High School",
    };

    const selectedReadability = mode && readabilityMap[mode] ? readabilityMap[mode] : "High School";

    // Call Undetectable AI's official humanization endpoint
    const apiResponse = await fetch("https://humanize.undetectable.ai/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey, // Correct header required by Undetectable AI
      },
      body: JSON.stringify({
        content: trimmedText,
        readability: selectedReadability,
        purpose: "General Writing", // Options: "General Writing", "Essay", "Article", etc.
        strength: "Balanced",      // Options: "Quality", "Balanced", "More Human"
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Undetectable API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to process text through humanizer service." },
        { status: 500 }
      );
    }

    const data = await apiResponse.json();
    
    // Extract result text based on common API output schemas
    const resultText = data.output || data.result || data.text;

    if (!resultText) {
      return NextResponse.json(
        { error: "Received empty response from humanizer service." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: resultText.trim() });

  } catch (error: any) {
    console.error("========== HUMANIZER ROUTE ERROR ==========");
    console.error(error);

    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}