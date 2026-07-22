import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.0-flash"; // Fast and highly responsive model
const MAX_TEXT_LENGTH = 12_000;

// Dynamic System Prompts based on selected Mode
const MODE_PROMPTS: Record<string, string> = {
  Standard: `Rewrite the text to sound naturally human. Vary sentence lengths, use organic conversational flow, avoid over-polished corporate buzzwords, and preserve every original detail.`,
  
  Friendly: `Rewrite the text as if you are casually explaining it to a friend. Use a warm tone, natural contractions, and straightforward everyday language while keeping all facts intact.`,
  
  Academic: `Rewrite the text in clear student-level academic prose. Avoid robotic generic transitions (e.g., "Furthermore", "In conclusion", "Crucial") and write with varied, natural sentence structures.`,
  
  Professional: `Rewrite the text in direct, clear workplace language. Keep it polished yet conversational, sounding like an experienced professional rather than an AI assistant.`,
  
  Simple: `Rewrite using simple, plain language with clear sentence structures while preserving all core facts and details.`
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, mode } = body as { text?: string; mode?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "Please provide valid text to humanize." },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { error: `Text exceeds character limit of ${MAX_TEXT_LENGTH}.` },
        { status: 400 }
      );
    }

    const inputWordCount = countWords(trimmedText);
    const selectedMode = mode && MODE_PROMPTS[mode] ? mode : "Standard";
    const modeInstruction = MODE_PROMPTS[selectedMode];

    // Build system prompt for Gemini
    const systemInstruction = `You are an expert human editor rephrasing text to sound 100% written by a real person.

RULES:
1. Target Word Count: ~${inputWordCount} words (Keep within 90%–110% of input length).
2. Retain ALL facts, details, and context. Do NOT summarize or drop information.
3. Eliminate AI buzzwords (e.g., "delve", "tapestry", "crucial", "testament", "pivotal", "in today's world").
4. Mode Style: ${modeInstruction}

Output ONLY the rewritten text without intros, headers, or quotes.`;

    // Call Gemini API using @google/genai SDK
const response = await ai.models.generateContent({
  model: MODEL_NAME,
  contents: [
    {
      role: "user",
      parts: [{ text: `Humanize the following text:\n\n${trimmedText}` }],
    },
  ],
  config: {
    systemInstruction: systemInstruction,
  },
});

    const resultText = response.text?.trim();

    if (!resultText) {
      return Response.json(
        { error: "Failed to generate humanized text." },
        { status: 500 }
      );
    }

    return Response.json({ result: resultText });

  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    return Response.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}