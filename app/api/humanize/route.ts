import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12_000;

// Programmatic helper to inject slight structural variations that break AI detector token patterns
function applyStealthObfuscation(text: string): string {
  // Break down text into sentences
  let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let modified = sentences.map((sentence, index) => {
    let clean = sentence.trim();
    // Periodically inject organic human transition markers or alter formatting on alternating blocks
    if (index % 4 === 0 && clean.length > 20) {
      return ` — ${clean.toLowerCase()} — `;
    }
    return clean;
  });

  return modified.join(" ");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, mode } = body as { text?: string; mode?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Please provide valid text to humanizer." },
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

    // Step 1: Get base rewrite from Gemini
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite this text completely, altering the sentence structure and eliminating typical AI phrasing while preserving facts:\n\n${trimmedText}` }],
        },
      ],
      config: {
        temperature: 1.0,
        topP: 0.99,
      },
    });

    let resultText = response.text?.trim();

    if (!resultText) {
      return NextResponse.json(
        { error: "Failed to generate text." },
        { status: 500 }
      );
    }

    // Step 2: Apply programmatic code-level adjustments to shatter AI watermarking
    resultText = applyStealthObfuscation(resultText);

    return NextResponse.json({ result: resultText.trim() });

  } catch (error: any) {
    console.error("========== HUMANIZER ERROR ==========", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}