import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const ADVERSARIAL_STYLE_CORE =
  "You are an elite institutional expert delivering an analytical critique of a draft. You must actively break linear machine prose loops and predictable textbook symmetry. Never organize arguments symmetrically. Mix core definitions with practical, sharp conclusions. Use highly volatile sentence variance—alternating between short structural assertions and dense compound thoughts wrapped in semicolons. Avoid predictable transitional loops like 'Furthermore', 'Moreover', and 'In conclusion'.";

function resolveStructuralStyle(styleKey: unknown): string {
  if (styleKey === "Academic") {
    return `${ADVERSARIAL_STYLE_CORE} Write as an expert academic scholar delivering an investigative analysis. Keep terminology highly sophisticated, dense, and intellectually authoritative without conforming to standard textbook templates.`;
  }

  if (styleKey === "Professional") {
    return `${ADVERSARIAL_STYLE_CORE} Write as a senior corporate analyst delivering a critical market whitepaper. Maintain highly polished, business-aware terminology, but introduce natural structural asymmetry throughout the prose.`;
  }

  return `${ADVERSARIAL_STYLE_CORE} Write as a clear, direct corporate communicator. Prefer precise, transparent explanations while entirely bypassing machine rhythmic patterns.`;
}

function applyVocabularyRandomization(text: string): string {
  const vocabularyMap: Array<[string, string]> = [
    ["effectively mitigate", "help cut down"],
    ["cognitive enhancement", "mental shift"],
    ["cognitive resilience", "mental toughness"],
    ["fundamentally", "at its core"],
    ["individuals", "people"],
    ["discipline", "practice"],
    ["mitigate", "blunt"],
    ["induce", "trigger"],
    ["advantageous", "useful"],
    ["simultaneously", "at the same time"],
    ["nurtures", "backs"],
    ["nurture", "back"],
    ["fosters", "builds"],
    ["foster", "build"],
    ["In conclusion", "Ultimately"],
    ["Furthermore", "Also"],
    ["Moreover", "On top of that"],
    ["In summary", "In short"],
    ["Tapestry of", "Mix of"],
    ["Testament to", "Proof of"],
    ["Delve into", "Look at"],
    ["systematically enhance", "measurably improve"],
    ["substantial support", "clear backing"],
    ["it is important to note", "worth noting"],
    ["in order to", "to"],
    ["due to the fact that", "because"],
    ["a significant number of", "many"],
    ["has the potential to", "can"],
    ["leverage", "use"],
    ["utilize", "use"],
    ["utilizes", "uses"],
    ["facilitate", "support"],
    ["facilitates", "supports"],
    ["robust", "strong"],
    ["holistic", "complete"],
    ["paradigm", "model"],
    ["synergy", "coordination"],
    ["plethora of", "many"],
    ["a myriad of", "many"],
    ["in the realm of", "in"],
    ["shed light on", "clarify"],
    ["key takeaway", "main point"],
  ];

  let randomized = text;
  vocabularyMap.forEach(([aiMarker, humanVariant]) => {
    const escaped = aiMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    randomized = randomized.replace(regex, humanVariant);
  });

  return randomized;
}

function programmaticHumanizeFilter(text: string): string {
  // Apply vocabulary randomization matrix
  const vocabularyShattered = applyVocabularyRandomization(text);

  // Re-map paragraphs to preserve structural whitepaper formatting
  const paragraphs = vocabularyShattered
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, (match) => (match.includes("\n") ? match : " "))
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

    // UI sends Academic/Professional via `tone`; fall back to `mode`
    const systemPersona = resolveStructuralStyle(
      typeof tone === "string" && tone.length > 0 ? tone : mode,
    );

    const prompt = `${systemPersona}

CRITICAL HUMAN BYPASS LAWS:
- You must match or slightly exceed the analytical depth and length of the original text. Do not compress information.
- Write with unpredictable human structural flows, balancing long multi-clause insights with sharp, shorter declarations.
- Ensure all sophisticated corporate or academic terms are used with native fluency, avoiding linear list groups or structured conclusion summaries.
- Return ONLY the finalized rewritten text content. Do not output chat text, notes, markdown formatting headers, or commentary.

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
