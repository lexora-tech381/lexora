import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12_000;

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

    const systemInstruction = `You are an expert human copywriter. Your goal is to rewrite the provided text so that it reads completely naturally, fluently, and like it was written by an experienced human writer.

RULES:
1. **Maintain Quality & Meaning:** Keep 100% of the original facts, context, and meaning intact. Do not add childish metaphors, fake stories, or weird formatting symbols (like random dashes).
2. **Organic Sentence Rhythm:** Avoid uniform, robotic sentence lengths. Mix concise, punchy statements with smooth, flowing thoughts.
3. **Eliminate AI Signatures:** Never use predictable machine transitional phrases like "furthermore", "moreover", "in conclusion", "crucial", "delve", or "testament".
4. **Tone:** ${mode || "Standard"}. Keep the writing style professional, clean, and clear.

Output ONLY the rewritten text with no introduction, markdown blocks, or quotes.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite this text naturally:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const resultText = response.text?.trim();

    if (!resultText) {
      return NextResponse.json(
        { error: "Failed to generate text." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("========== HUMANIZER ERROR ==========", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}