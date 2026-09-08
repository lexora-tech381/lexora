import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 8192;

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export function readGeminiText(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "";
  }

  const maybeText = (response as { text?: unknown }).text;
  if (typeof maybeText === "string" && maybeText.trim()) {
    return maybeText;
  }

  if (typeof maybeText === "function") {
    try {
      const value = (maybeText as () => unknown)();
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    } catch {
      // Fall through to candidates parsing.
    }
  }

  const candidates = (response as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "";
  }

  const firstCandidate = candidates[0] as {
    content?: { parts?: Array<{ text?: unknown }> };
  };
  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export function normalizeHumanizedOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateGeminiText(prompt: string): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  return normalizeHumanizedOutput(readGeminiText(response));
}
