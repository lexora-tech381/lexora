import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

// Clean, punchy human conversational inserts that don't delete structural words
const TRANSITION_BREAKS = [
  " — and honestly, ",
  " — which basically means ",
  " — especially since ",
  " — and frankly, ",
  " — meaning ",
];

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

      // Spike burstiness only on overly-long sentences
      if (wordCount > 18) {
        const conjunctionMatch = /\s+(and|but|so|or)\s+/i.exec(current);

        if (
          conjunctionMatch &&
          typeof conjunctionMatch.index === "number" &&
          conjunctionMatch.index > 0 &&
          conjunctionMatch.index < current.length
        ) {
          // Slice right up to the conjunction word
          const part1 = current.substring(0, conjunctionMatch.index).trim();
          // Keep the conjunction word AND the rest of the text together safely
          const part2 = current.substring(conjunctionMatch.index).trim();

          if (part1 && part2) {
            const randomTransition =
              TRANSITION_BREAKS[
                Math.floor(Math.random() * TRANSITION_BREAKS.length)
              ];

            // Insert transition before the preserved conjunction (no lowercase mutation)
            processedSentences.push(
              `${part1}${randomTransition}${part2}`
                .replace(/\s+/g, " ")
                .trim(),
            );
            continue;
          }
        }
      }

      // Safe fallback: keep sentence as-is if no natural conjunction break point is found
      processedSentences.push(current);
    }

    return processedSentences.join(" ").replace(/\s+/g, " ").trim();
  });

  // 3. Rejoin structural layout paragraphs and clear loose markdown headers
  return processedParagraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, (match) => (match.includes("\n") ? match : " "))
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

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

    const structuralStyle =
      mode === "Academic"
        ? "an undergraduate student rushing an assignment with conversational nuance"
        : "a casual blogger writing a stream-of-consciousness piece";

    const prompt = `You are a human writer draft reviewer. Completely rewrite the text provided below. 
    
    CRITICAL BREAK LAWS:
    - You must completely sabotage standard machine prose patterns.
    - Write with severe, erratic burstiness, alternating between short punchy clauses and complex thoughts.
    - Eliminate formal transitions like 'Furthermore', 'Moreover', and 'In conclusion'.
    - Use conversational qualifiers and structural hesitation (e.g., 'Now, looking at this...', 'Granted, it means...').
    - Speak entirely in the active voice. Drop passive descriptions.
    - Preserve natural paragraph breaks from the source structure.
    - Emulate the style of ${structuralStyle}. Return ONLY the raw rewritten content. No chat, no notes, no markdown headings.

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
