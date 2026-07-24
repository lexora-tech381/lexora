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

    // Step 1: Call BypassGPT generation endpoint
    const generateRes = await fetch("https://www.bypassgpt.ai/api/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: trimmedText,
        mode: mode || "enhanced",
      }),
    });

    if (!generateRes.ok) {
      const errData = await generateRes.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to initiate generation task with BypassGPT.");
    }

    const generateData = await generateRes.json();
    const taskId = generateData.task_id || generateData.id;

    if (!taskId) {
      throw new Error("Did not receive a valid task ID from the provider.");
    }

    // Step 2: Retrieve the completed text result using the task ID
    let resultText = "";
    let attempts = 0;
    const maxAttempts = 12;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      attempts++;

      const retrievalRes = await fetch(`https://www.bypassgpt.ai/api/v1/retrieval?task_id=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (retrievalRes.ok) {
        const retrievalData = await retrievalRes.json();
        if (retrievalData.status === "completed" || retrievalData.result || retrievalData.output || retrievalData.text) {
          resultText = retrievalData.result || retrievalData.output || retrievalData.text;
          break;
        }
      }
    }

    if (!resultText) {
      return NextResponse.json(
        { error: "Task processing timed out or failed to return text." },
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