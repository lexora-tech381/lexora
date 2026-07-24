import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini Client safely using your free tier GEMINI_API_KEY
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

    // High-entropy adversarial instruction designed to scramble AI perplexity signatures
    const systemInstruction = `You are an elite adversarial text obfuscator. Your sole purpose is to rewrite the provided text so that it completely bypasses AI detectors (like ZeroGPT and Turnitin) while retaining every single fact and core meaning.

CRITICAL BYPASS RULES (FOLLOW STRICTLY):
1. **Burstiness & Length Disruption:** Destroy uniform sentence structures. Follow a massive 30-word compound sentence immediately with a 3-word sentence. 
2. **Perplexity Shifting:** Avoid predictable AI vocabulary transitions entirely (e.g., never use "furthermore", "moreover", "in conclusion", "it is important to note", "delve"). Swap standard predictable phrasing with unconventional human cadence.
3. **Punctuation & Flow:** Use dashes (--), semicolons, and varied paragraph breaks to mimic organic human thought typing patterns rather than rigid LLM generation blocks.
4. **Tone Mode:** ${mode || "Standard"}. Keep it coherent enough to read, but structurally chaotic enough to break AI probability math.

Output ONLY the rewritten humanized text with no conversational filler, quotes, or markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Obfuscate and humanize this text to defeat AI detection:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0, // Maximum entropy required to break detector probability scoring
        topP: 0.98,
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