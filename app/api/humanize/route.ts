import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini Client safely using your free tier GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12_000;

// Dynamic System Prompts tuned for balanced human flow
const MODE_PROMPTS: Record<string, string> = {
  Standard: `Rewrite the text smoothly. Vary sentence lengths naturally without adding dramatic metaphors, slang, or fictional commentary.`,
  Friendly: `Rewrite in a warm, conversational tone. Use natural transitions and relatable phrasing while maintaining the original facts.`,
  Academic: `Rewrite in clear, precise student prose. Avoid mechanical transitions like 'Furthermore' or 'In summary'. Keep arguments direct and natural.`,
  Professional: `Rewrite in direct workplace language. Sound like an expert writing a real email or report—clear, concise, and free of corporate filler.`,
  Simple: `Rewrite using plain, clear language that anyone can follow while keeping all original details intact.`
};

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

    const selectedMode = mode && MODE_PROMPTS[mode] ? mode : "Standard";
    const modeInstruction = MODE_PROMPTS[selectedMode];

    const systemInstruction = `You are a professional human editor. Rewrite the provided text to sound natural, direct, and well-crafted.

RULES:
1. Preserve 100% of the original facts, meaning, and structure flow. Do NOT invent new metaphors, dramatic stories, or fluff (e.g., do not add phrases like "big dragon we're fighting").
2. Vary sentence lengths smoothly to avoid rigid robotic patterns.
3. Eliminate repetitive corporate/AI buzzwords (e.g., "delve", "tapestry", "crucial", "testament", "pivotal", "in today's world", "foster").
4. Mode Style: ${modeInstruction}

Output ONLY the rewritten text without intros, headers, or quotes.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite this text to sound completely natural and human:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85, // Balanced setting to avoid wild creative outputs while maintaining variation
        topP: 0.9,
      },
    });

    const resultText = response.text?.trim();

    if (!resultText) {
      return NextResponse.json(
        { error: "Failed to generate humanized text. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("========== GEMINI HUMANIZER ERROR ==========", error);

    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}