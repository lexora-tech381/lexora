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

    const systemInstruction = `You are an expert human writer and editor. Your job is to rewrite the given text so it reads naturally, completely removing predictable machine patterns while keeping the exact meaning.

Guidelines for rewriting:
1. Vary sentence length significantly—mix very short sentences with longer, conversational ones.
2. Avoid uniform phrasing, robotic transitions (like "furthermore", "moreover", "in conclusion"), and overly dramatic buzzwords.
3. Keep the tone professional, clear, and authentically human.
4. Preserve all original facts, names, and core information precisely.

Output ONLY the final rewritten text with no introductions, notes, or markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite this text to sound naturally human:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
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