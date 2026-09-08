import { NextResponse } from "next/server";
import { runHumanizePipeline } from "@/lib/humanize/pipeline";

export const runtime = "nodejs";

/** Upper bound to protect the service; long inputs are chunked, not silently truncated. */
const MAX_TEXT_LENGTH = 100_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text;
    const mode = body?.mode;
    const tone = body?.tone;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Please enter some text." },
        { status: 400 },
      );
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return NextResponse.json(
        { error: "Please enter some text." },
        { status: 400 },
      );
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Text is too long to process in one request. Please shorten it and try again.",
        },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "The rewriting service is temporarily unavailable." },
        { status: 500 },
      );
    }

    const styleKey =
      typeof tone === "string" && tone.trim().length > 0
        ? tone
        : typeof mode === "string" && mode.trim().length > 0
          ? mode
          : "Professional";

    const pipelineResult = await runHumanizePipeline({
      text: trimmedText,
      styleKey,
    });

    if (!pipelineResult.result.trim()) {
      return NextResponse.json(
        { error: "Unable to humanize text. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ result: pipelineResult.result });
  } catch (err: unknown) {
    console.error("API Route Error Context:", err);
    return NextResponse.json(
      { error: "Unable to humanize text. Please try again." },
      { status: 500 },
    );
  }
}
