import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const BUZZWORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bin conclusion\b/gi, "Ultimately"],
  [/\bfurthermore\b/gi, "Also"],
  [/\bmoreover\b/gi, "On top of that"],
  [/\btapestry of\b/gi, "Mix of"],
  [/\btestament to\b/gi, "Proof of"],
  [/\bdelve into\b/gi, "Look at"],
  [/\bdelves into\b/gi, "Looks at"],
  [/\bdelving into\b/gi, "Looking at"],
  [/\badditionally\b/gi, "Also"],
  [/\bconsequently\b/gi, "So"],
  [/\btherefore\b/gi, "That's why"],
  [/\bultimately\b/gi, "In the end"],
  [/\bparamount\b/gi, "really important"],
  [/\bpivotal\b/gi, "key"],
  [/\bcrucial\b/gi, "important"],
  [/\bleverage\b/gi, "use"],
  [/\bfoster\b/gi, "encourage"],
  [/\bunderscore\b/gi, "highlight"],
  [/\bmultifaceted\b/gi, "many-sided"],
  [/\bin today's fast-paced world\b/gi, "these days"],
];

function countWords(sentence: string): number {
  const matches = sentence.match(/[A-Za-z0-9']+/g);
  return matches ? matches.length : 0;
}

function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z"'(\d])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sliceLongSentence(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= 18) return [sentence.trim()];

  const conjunctions = new Set([
    "and",
    "but",
    "so",
    "or",
    "because",
    "while",
    "although",
    "when",
    "as",
  ]);

  const mid = Math.floor(words.length / 2);
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 3; index < words.length - 3; index += 1) {
    const token = words[index].toLowerCase().replace(/[^\w']/g, "");
    if (!conjunctions.has(token)) continue;
    const distance = Math.abs(index - mid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  if (bestIndex > 0) {
    const left = words.slice(0, bestIndex).join(" ").replace(/[,;:]+$/, "");
    let right = words.slice(bestIndex + 1).join(" ").replace(/^[,;:]+/, "");
    const useDash = bestIndex % 2 === 0;
    if (useDash) {
      return [`${left} — ${right}`];
    }
    right = right ? right.charAt(0).toUpperCase() + right.slice(1) : right;
    return [`${left}.`, right];
  }

  const cut = Math.max(5, Math.min(words.length - 4, mid + (words.length % 2 === 0 ? -2 : 2)));
  const left = words.slice(0, cut).join(" ").replace(/[,;:]+$/, "");
  let right = words.slice(cut).join(" ").replace(/^[,;:]+/, "");
  right = right ? right.charAt(0).toUpperCase() + right.slice(1) : right;
  return [`${left}.`, right];
}

function programmaticHumanizeFilter(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return cleaned;

  for (const [pattern, replacement] of BUZZWORD_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const rebuilt = paragraphs.map((paragraph) => {
    const sentences = splitIntoSentences(paragraph);
    const fractured: string[] = [];

    for (const sentence of sentences) {
      if (countWords(sentence) > 18) {
        fractured.push(...sliceLongSentence(sentence));
      } else {
        fractured.push(sentence);
      }
    }

    return fractured.join(" ").replace(/\s+/g, " ").trim();
  });

  return rebuilt
    .join("\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function resolvePersona(mode: unknown): { tone: string; identity: string } {
  switch (mode) {
    case "Academic":
      return {
        tone: "academic",
        identity:
          "a tired college student rushing an assignment the night before it is due",
      };
    case "Professional":
      return {
        tone: "professional",
        identity:
          "a blunt workplace writer who sounds human and slightly impatient, not corporate-polished",
      };
    case "Friendly":
      return {
        tone: "friendly",
        identity:
          "a stream-of-consciousness blogger thinking out loud while still making sense",
      };
    case "Simple":
      return {
        tone: "simple",
        identity:
          "a practical person explaining ideas plainly with uneven, natural pacing",
      };
    case "Creative":
      return {
        tone: "creative",
        identity:
          "a stream-of-consciousness blogger who jumps between sharp short lines and longer wandering thoughts",
      };
    default:
      return {
        tone: "natural",
        identity:
          "a tired college student rushing an assignment and writing the way people actually talk on paper",
      };
  }
}

function buildChaoticPrompt(
  text: string,
  tone: string,
  identity: string,
): string {
  return `You are sabotaging machine prose patterns on purpose.

Write as ${identity}. Keep a ${tone} tone, but never sound like a polished AI essay generator.

HARD RULES:
- Completely break normal LLM cadence and linear probability paths.
- Use highly volatile sentence lengths: mix 3-word punchy clauses with 30-word compound sentences.
- Ban structural symmetry. No numbered lists. No neat triplets. No tidy formal summaries.
- Do not open with clean definitions followed by sequenced explanations.
- Skip formal transitions like "Furthermore", "Moreover", "In conclusion", "Additionally".
- Prefer conversational hesitation and plain wording over balanced academic polish.
- Rewrite every sentence from scratch. Do not do minor synonym swaps.
- Preserve every fact, name, number, citation, and core argument.
- Keep roughly the same length and paragraph count.
- Return only the rewritten text. No notes, no preface, no markdown fences.

SOURCE TEXT:
${text}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text;
    const mode = body?.mode;

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
        { error: "Text is too long." },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "The rewriting service is temporarily unavailable." },
        { status: 500 },
      );
    }

    const { tone, identity } = resolvePersona(mode);
    const prompt = buildChaoticPrompt(trimmedText, tone, identity);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.98,
        topP: 0.95,
      },
    });

    const rawResult = response.text;
    if (!rawResult || !rawResult.trim()) {
      throw new Error("Empty response from Gemini.");
    }

    const result = programmaticHumanizeFilter(rawResult);

    if (!result) {
      throw new Error("Unable to generate a rewritten result. Please try again.");
    }

    return NextResponse.json({
      result,
    });
  } catch (err: unknown) {
    console.error(err);

    const message =
      err instanceof Error ? err.message : "Something went wrong.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
