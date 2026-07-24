import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini Client safely using your free tier GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12_000;

// Dynamic System Prompts tuned for high-entropy phrasing to avoid AI detectors
const MODE_PROMPTS: Record<string, string> = {
  Standard: `Rewrite naturally. Mix short blunt statements with long fluid ideas. Use conversational transitions and organic phrasing.`,
  Friendly: `Rewrite as if chatting with a close friend. Use casual phrasing, contractions, relatable analogies, and a warm, informal rhythm.`,
  Academic: `Rewrite in clear, human student prose. Avoid mechanical transitions like 'Furthermore' or 'In summary'. Focus on direct argument flow and varied sentence structures.`,
  Professional: `Rewrite in direct workplace language. Sound like an expert writing a real email or report—clear, candid, and free of corporate fluff.`,
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

    // ==========================================
    // PASS 1: Structural Chaos & Burstiness Pass
    // ==========================================
    const pass1SystemInstruction = `You are an aggressive structural editor. Your job is to completely rewrite the text to destroy standard AI patterns.
    
RULES:
1. Drastically vary sentence lengths. Mix tiny 3-word sentences with sweeping, compound thoughts to maximize "burstiness".
2. Change active/passive voices unpredictably.
3. Completely eliminate AI buzzwords: "delve", "tapestry", "crucial", "testament", "pivotal", "in today's world", "foster", "moreover", "furthermore".
4. Mode Style: ${modeInstruction}

Output ONLY the structurally transformed text.`;

    const pass1Response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Deconstruct and rewrite this text layout:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: pass1SystemInstruction,
        temperature: 1.0, // Maximum randomness for sentence shaping
        topP: 0.95,
      },
    });

    const intermediateText = pass1Response.text?.trim() || trimmedText;

    // ==========================================
    // PASS 2: Human Flow & Tone Refinement Pass
    // ==========================================
    const pass2SystemInstruction = `You are a human copyeditor smoothing out a rough draft. 
    
RULES:
1. Ensure 100% of the original facts, figures, and technical terms remain entirely intact.
2. Make the flow sound like it was written organically by a real person on a keyboard.
3. Remove any weird artifacts or clunky phrasing left over from the structural rewrite.
4. Output ONLY the final humanized text without any conversational filler, intros, quotes, or headers.`;

    const pass2Response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Polish this draft into natural human prose:\n\n${intermediateText}` }],
        },
      ],
      config: {
        systemInstruction: pass2SystemInstruction,
        temperature: 0.85, // Balanced readability control
        topP: 0.9,
      },
    });

    const resultText = pass2Response.text?.trim();

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