import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

function programmaticHumanizeFilter(text: string): string {
  // 1. Dynamic replacement of AI signifiers
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

  // 2. Safe, crash-proof burstiness injector
  const sentences =
    filteredText.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [filteredText];
  const processedSentences: string[] = [];
  const transitionBreaks = [
    ", which means ",
    ", especially since ",
    "—and frankly, ",
    "—mostly because ",
    ", meaning ",
  ];

  for (let i = 0; i < sentences.length; i++) {
    let current = sentences[i].trim();
    if (!current) continue;

    const wordCount = current.split(/\s+/).filter(Boolean).length;

    // Only attempt to split if the sentence is overly long
    if (wordCount > 18) {
      // Prefer the earliest natural break: comma or coordinating conjunction
      const commaMatch = /,\s*/.exec(current);
      const conjunctionMatch = /\s+(and|but|so|or)\s+/i.exec(current);

      let breakStart = -1;
      let breakLength = 0;

      if (commaMatch && typeof commaMatch.index === "number") {
        breakStart = commaMatch.index;
        breakLength = commaMatch[0].length;
      }

      if (
        conjunctionMatch &&
        typeof conjunctionMatch.index === "number" &&
        (breakStart === -1 || conjunctionMatch.index < breakStart)
      ) {
        breakStart = conjunctionMatch.index;
        breakLength = conjunctionMatch[0].length;
      }

      // Guard: only split when both sides exist and indices are in range
      if (
        breakStart > 0 &&
        breakLength > 0 &&
        breakStart + breakLength < current.length
      ) {
        const part1 = current.substring(0, breakStart).trim();
        const part2 = current.substring(breakStart + breakLength).trim();

        if (part1 && part2) {
          const randomTransition =
            transitionBreaks[
              Math.floor(Math.random() * transitionBreaks.length)
            ];
          const right =
            part2.charAt(0).toLowerCase() +
            (part2.length > 1 ? part2.slice(1) : "");
          processedSentences.push(
            `${part1}${randomTransition}${right}`.replace(/\s+/g, " ").trim(),
          );
          continue;
        }
      }
    }

    processedSentences.push(current);
  }

  return processedSentences
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
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
    - Emulate the style of ${structuralStyle}. Return ONLY the raw rewritten content. No chat, no notes.

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

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
