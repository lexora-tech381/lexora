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

const TRANSITION_BREAKS = [
  ", which means ",
  ", especially since ",
  "—and frankly, ",
  "—mostly because ",
  ", meaning ",
];

const COORDINATING_CONJUNCTIONS = new Set(["and", "but", "so", "or"]);

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

function cleanClause(text: string): string {
  return text
    .replace(/^[\s,;:—–-]+/, "")
    .replace(/[\s,;:—–-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTransition(seed: number): string {
  return TRANSITION_BREAKS[seed % TRANSITION_BREAKS.length];
}

/**
 * Smoothly introduce burstiness by replacing the first natural break
 * (comma or coordinating conjunction) with an em-dash / transition phrase.
 * Never hard-cuts mid-word or inserts a period that orphans a capital letter.
 */
function softenLongSentence(sentence: string, seed: number): string {
  const trimmed = sentence.trim();
  if (countWords(trimmed) <= 18) return trimmed;

  const words = trimmed.split(/\s+/);
  let breakIndex = -1;
  let breakType: "comma" | "conjunction" | null = null;

  for (let index = 3; index < words.length - 3; index += 1) {
    const raw = words[index];
    const normalized = raw.toLowerCase().replace(/[^\w']/g, "");

    if (raw.endsWith(",")) {
      breakIndex = index;
      breakType = "comma";
      break;
    }

    if (COORDINATING_CONJUNCTIONS.has(normalized)) {
      breakIndex = index;
      breakType = "conjunction";
      break;
    }
  }

  if (breakIndex === -1) {
    // No safe grammatical hinge found — leave intact to avoid broken fragments.
    return trimmed;
  }

  const left = cleanClause(words.slice(0, breakIndex).join(" "));
  const right = cleanClause(words.slice(breakIndex + 1).join(" "));

  if (!left || !right) return trimmed;

  // Keep right clause lowercase when bridging with a transition/em-dash,
  // so we never create "anxious. Disappointed" style period splits.
  const rightJoined =
    right.charAt(0).toLowerCase() + (right.length > 1 ? right.slice(1) : "");

  if (breakType === "comma" || seed % 2 === 0) {
    const bridge = pickTransition(seed);
    return cleanClause(`${left}${bridge}${rightJoined}`);
  }

  return cleanClause(`${left} — ${rightJoined}`);
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

  const rebuilt = paragraphs.map((paragraph, paragraphIndex) => {
    const sentences = splitIntoSentences(paragraph);
    const reshaped = sentences.map((sentence, sentenceIndex) =>
      softenLongSentence(sentence, paragraphIndex + sentenceIndex + sentence.length),
    );

    return reshaped
      .map((sentence) => cleanClause(sentence))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/[—–-]{2,}/g, "—")
      .replace(/\s*—\s*/g, " — ")
      .replace(/\s+/g, " ")
      .trim();
  });

  return rebuilt
    .join("\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/(?:—\s*)+$/g, "")
    .replace(/\s+/g, (match) => (match.includes("\n") ? match : " "))
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
