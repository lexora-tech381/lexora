import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

// Clean connectors that replace stripped conjunctions without duplicating them
const TRANSITION_BREAKS = [
  " — and honestly, ",
  " — which basically means that ",
  " — especially since ",
  " — and frankly, ",
  " — meaning that ",
] as const;

function resolveStructuralStyle(styleKey: unknown): string {
  if (styleKey === "Academic") {
    return "a published research author writing an analytical paper. Use complex vocabulary, intellectual pacing, and authoritative phrasing.";
  }

  if (styleKey === "Professional") {
    return "a senior corporate executive writing an analytical industry whitepaper. Use precise business terminology, clear data-driven pacing, and polished corporate phrasing.";
  }

  // Friendly, Simple, Natural, or any unrecognized selection
  return "a clear, direct communicator explaining concepts plainly without jargon.";
}

function pickAlternateTransitionIndex(lastUsedIndex: number): number {
  if (TRANSITION_BREAKS.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * TRANSITION_BREAKS.length);
  if (nextIndex === lastUsedIndex) {
    nextIndex = (nextIndex + 1) % TRANSITION_BREAKS.length;
  }
  return nextIndex;
}

function isSafeConjunctionSplit(part1: string, rawPart2: string): boolean {
  const part1Words = part1.split(/\s+/).filter(Boolean);
  const part2Words = rawPart2.split(/\s+/).filter(Boolean);

  // Both sides must carry enough content so verbs keep their nouns/objects
  if (part1Words.length < 8 || part2Words.length < 6) {
    return false;
  }

  const lastWord = part1Words[part1Words.length - 1] ?? "";
  const firstWord = part2Words[0] ?? "";

  // Avoid cutting parallel participles/gerunds: "directing and focusing"
  const endsWithIng = /ing$/i.test(lastWord.replace(/[^\w']/g, ""));
  const startsWithIng = /ing$/i.test(firstWord.replace(/[^\w']/g, ""));
  if (endsWithIng && startsWithIng) {
    return false;
  }

  return true;
}

function findSafeConjunctionMatch(
  current: string,
): RegExpExecArray | null {
  const conjunctionPattern = /\s+(and|but|so|or)\s+/gi;
  let match: RegExpExecArray | null = conjunctionPattern.exec(current);
  let bestMatch: RegExpExecArray | null = null;
  let bestBalance = Number.POSITIVE_INFINITY;
  const midpoint = current.length / 2;

  while (match) {
    const matchIndex = match.index;
    const matchLength = match[0].length;
    const part1 = current.substring(0, matchIndex).trim();
    const rawPart2 = current.substring(matchIndex + matchLength).trim();

    if (isSafeConjunctionSplit(part1, rawPart2)) {
      const balance = Math.abs(matchIndex - midpoint);
      if (balance < bestBalance) {
        bestBalance = balance;
        bestMatch = match;
      }
    }

    match = conjunctionPattern.exec(current);
  }

  return bestMatch;
}

function programmaticHumanizeFilter(text: string): string {
  // 1. Dynamic replacement of explicit AI signifiers
  const replacements: { [key: string]: string } = {
    "In conclusion": "Ultimately",
    Furthermore: "Also",
    Moreover: "On top of that",
    "Tapestry of": "Mix of",
    "Testament to": "Proof of",
    Bespoke: "Custom",
    "Delve into": "Look at",
    "In summary": "In short",
    "Crucial role": "Big part",
  };

  let filteredText = text;
  Object.entries(replacements).forEach(([aiWord, humanWord]) => {
    const escaped = aiWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    filteredText = filteredText.replace(regex, humanWord);
  });

  // Track last transition across the whole document to prevent repetition
  let lastTransitionIndex = -1;

  // 2. Process paragraph by paragraph to maintain clean essay layout
  const paragraphs = filteredText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const processedParagraphs = paragraphs.map((paragraph) => {
    const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
    const processedSentences: string[] = [];

    for (let i = 0; i < sentences.length; i += 1) {
      const current = sentences[i].trim();
      if (!current) continue;

      const wordCount = current.split(/\s+/).filter(Boolean).length;

      // Only split true long sentences
      if (wordCount > 22) {
        const conjunctionMatch = findSafeConjunctionMatch(current);

        if (
          conjunctionMatch &&
          typeof conjunctionMatch.index === "number" &&
          typeof conjunctionMatch[0] === "string" &&
          conjunctionMatch[0].length > 0 &&
          conjunctionMatch.index > 0 &&
          conjunctionMatch.index + conjunctionMatch[0].length <= current.length
        ) {
          const matchIndex = conjunctionMatch.index;
          const matchLength = conjunctionMatch[0].length;

          const part1 = current.substring(0, matchIndex).trim();
          const rawPart2 = current
            .substring(matchIndex + matchLength)
            .trim();

          if (part1 && rawPart2 && isSafeConjunctionSplit(part1, rawPart2)) {
            const transitionIndex =
              pickAlternateTransitionIndex(lastTransitionIndex);
            lastTransitionIndex = transitionIndex;
            const randomTransition = TRANSITION_BREAKS[transitionIndex];

            processedSentences.push(
              `${part1}${randomTransition}${rawPart2}`
                .replace(/\s+/g, " ")
                .replace(/,\s*—/g, " —")
                .trim(),
            );
            continue;
          }
        }
      }

      // Safe fallback: keep sentence as-is if no natural conjunction break point is found
      processedSentences.push(current);
    }

    return processedSentences
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/,\s*—/g, " —")
      .trim();
  });

  // 3. Rejoin structural layout paragraphs and clear loose markdown headers
  return processedParagraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, (match) => (match.includes("\n") ? match : " "))
    .replace(/,\s*—/g, " —")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { text, mode, tone } = await req.json();

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

    // UI sends Academic/Professional/Friendly via `tone`; also accept `mode` for those values
    const structuralStyle = resolveStructuralStyle(
      typeof tone === "string" && tone.length > 0 ? tone : mode,
    );

    const prompt = `You are an elite human editor and writer. Your job is to rewrite the text to match the identity of ${structuralStyle}

CRITICAL BREAK LAWS:
- Ensure the text perfectly mirrors the depth and technical complexity of the input text. Do not compress information. Avoid obvious machine transitional phrases ('Furthermore', 'Moreover', 'In conclusion'), but maintain the exact level of formal sophistication required for a professional or academic setting. Use human-like varied sentence structures—mixing short assertions with complex, multi-clause explanations using semicolons and em-dashes naturally.
- Preserve natural paragraph breaks from the source structure.
- You must match or slightly exceed the length and depth of the original text. Do not summarize, skip examples, or compress detailed explanations.
- Elaborate naturally on thoughts so the comprehensive depth of the input text remains completely intact.
- Return ONLY the raw rewritten content. No chat, no notes, no markdown headings.

Text to rewrite:
${trimmedText}`;

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
      return NextResponse.json(
        { error: "Empty response from Gemini engine." },
        { status: 500 },
      );
    }

    const humanizedOutput = programmaticHumanizeFilter(rawResult.trim());

    return NextResponse.json({ result: humanizedOutput });
  } catch (err: unknown) {
    console.error("API Route Error Context:", err);
    const message =
      err instanceof Error
        ? err.message
        : "An internal processing error occurred.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
