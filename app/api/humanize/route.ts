import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

// High-level professional transitions that maintain executive prose authority
const CLAUSE_TRANSITIONS = [
  " — an analytical reality highlighting why ",
  " — which, from an execution standpoint, implies that ",
  " — driven primarily by the fact that ",
  " — a structural factor that becomes clear when ",
  " — fundamentally indicating that ",
  " — an outcome directly correlated with the reality that ",
] as const;

const ADVERSARIAL_STYLE_CORE =
  "You are a senior institutional researcher rewriting a draft for an executive journal. You must maintain sophisticated, formal terminology but completely destroy standard, linear machine prose loops. Use asymmetric clause placements, vary sentence lengths aggressively (alternating short dynamic facts with multi-clause compound sentences using semicolons), and avoid predictable transitional triplets or rigid summaries at the end of paragraphs. Never organize arguments symmetrically. Mix core definitions with practical, sharp conclusions. Avoid predictable transitional loops like 'Furthermore', 'Moreover', and 'In conclusion'.";

function resolveStructuralStyle(styleKey: unknown): string {
  if (styleKey === "Academic") {
    return `${ADVERSARIAL_STYLE_CORE} Write as an expert academic scholar delivering an investigative analysis. Keep terminology highly sophisticated, dense, and intellectually authoritative without conforming to standard textbook templates.`;
  }

  if (styleKey === "Professional") {
    return `${ADVERSARIAL_STYLE_CORE} Write as a senior corporate analyst delivering a critical market whitepaper. Maintain highly polished, business-aware terminology, but introduce natural structural asymmetry throughout the prose.`;
  }

  return `${ADVERSARIAL_STYLE_CORE} Write as a clear, direct corporate communicator. Prefer precise, transparent explanations while entirely bypassing machine rhythmic patterns.`;
}

function pickAlternateTransitionIndex(lastUsedIndex: number): number {
  if (CLAUSE_TRANSITIONS.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * CLAUSE_TRANSITIONS.length);
  if (nextIndex === lastUsedIndex) {
    nextIndex = (nextIndex + 1) % CLAUSE_TRANSITIONS.length;
  }

  return nextIndex;
}

function applyVocabularyRandomization(text: string): string {
  const vocabularyMap: Array<[string, string]> = [
    ["effectively mitigate", "measurably reduce"],
    ["cognitive enhancement", "heightened cognitive performance"],
    ["cognitive resilience", "sustained cognitive endurance"],
    ["fundamentally", "at its core"],
    ["individuals", "participants"],
    ["discipline", "practice"],
    ["mitigate", "temper"],
    ["induce", "prompt"],
    ["advantageous", "strategically useful"],
    ["simultaneously", "at the same time"],
    ["nurtures", "reinforces"],
    ["nurture", "reinforce"],
    ["fosters", "builds"],
    ["foster", "build"],
    ["In conclusion", "Ultimately"],
    ["Furthermore", "Also"],
    ["Moreover", "Beyond that"],
    ["In summary", "In short"],
    ["Tapestry of", "Interplay of"],
    ["Testament to", "Evidence of"],
    ["Delve into", "Examine"],
    ["systematically enhance", "measurably improve"],
    ["substantial support", "clear empirical backing"],
    ["it is important to note", "worth noting"],
    ["in order to", "to"],
    ["due to the fact that", "because"],
    ["a significant number of", "many"],
    ["has the potential to", "can"],
    ["leverage", "apply"],
    ["utilize", "use"],
    ["utilizes", "uses"],
    ["facilitate", "enable"],
    ["facilitates", "enables"],
    ["robust", "durable"],
    ["holistic", "integrated"],
    ["paradigm", "framework"],
    ["synergy", "coordination"],
    ["plethora of", "many"],
    ["a myriad of", "many"],
    ["in the realm of", "in"],
    ["shed light on", "clarify"],
    ["key takeaway", "central implication"],
  ];

  let randomized = text;
  vocabularyMap.forEach(([aiMarker, humanVariant]) => {
    const escaped = aiMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    randomized = randomized.replace(regex, humanVariant);
  });

  return randomized;
}

function isSafeConjunctionSplit(part1: string, rawPart2: string): boolean {
  const part1Words = part1.split(/\s+/).filter(Boolean);
  const part2Words = rawPart2.split(/\s+/).filter(Boolean);

  if (part1Words.length < 5 || part2Words.length < 4) {
    return false;
  }

  const lastWord = (part1Words[part1Words.length - 1] ?? "").replace(
    /[^\w']/g,
    "",
  );
  const firstWord = (part2Words[0] ?? "").replace(/[^\w']/g, "");

  if (/ing$/i.test(lastWord) && /ing$/i.test(firstWord)) {
    return false;
  }

  return true;
}

function findSafeConjunctionMatch(current: string): RegExpExecArray | null {
  const conjunctionPattern = /\s+(and|but|so|or)\s+/gi;
  let match: RegExpExecArray | null = conjunctionPattern.exec(current);
  let bestMatch: RegExpExecArray | null = null;
  let bestBalance = Number.POSITIVE_INFINITY;
  const midpoint = current.length / 2;

  while (match) {
    if (
      typeof match.index === "number" &&
      typeof match[0] === "string" &&
      match[0].length > 0
    ) {
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
    }

    match = conjunctionPattern.exec(current);
  }

  return bestMatch;
}

function fractureLongSentences(
  paragraph: string,
  lastTransitionIndexRef: { value: number },
): string {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
  const processedSentences: string[] = [];

  for (let i = 0; i < sentences.length; i += 1) {
    const current = sentences[i].trim();
    if (!current) {
      continue;
    }

    const wordCount = current.split(/\s+/).filter(Boolean).length;

    if (wordCount > 16) {
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
        const rawPart2 = current.substring(matchIndex + matchLength).trim();

        if (part1 && rawPart2 && isSafeConjunctionSplit(part1, rawPart2)) {
          const transitionIndex = pickAlternateTransitionIndex(
            lastTransitionIndexRef.value,
          );
          lastTransitionIndexRef.value = transitionIndex;
          const transition = CLAUSE_TRANSITIONS[transitionIndex];

          processedSentences.push(
            `${part1}${transition}${rawPart2}`
              .replace(/\s+/g, " ")
              .replace(/,\s*—/g, " —")
              .trim(),
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
    .replace(/,\s*—/g, " —")
    .trim();
}

function programmaticHumanizeFilter(text: string): string {
  const vocabularyShattered = applyVocabularyRandomization(text);
  const lastTransitionIndexRef = { value: -1 };

  const paragraphs = vocabularyShattered
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const processedParagraphs = paragraphs.map((paragraph) =>
    fractureLongSentences(paragraph, lastTransitionIndexRef),
  );

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

    const structuralStyle = resolveStructuralStyle(
      typeof tone === "string" && tone.length > 0 ? tone : mode,
    );

    const prompt = `You are rewriting the draft below.

Identity and method:
${structuralStyle}

Non-negotiable rewrite laws:
- Maintain sophisticated, formal terminology throughout.
- Completely destroy standard, linear machine prose loops.
- Use asymmetric clause placements.
- Vary sentence lengths aggressively: alternate short dynamic facts with multi-clause compound sentences using semicolons.
- Avoid predictable transitional triplets or rigid summaries at the end of paragraphs.
- Do not use casual slang, brain-dump framing, or unpolished colloquial filler.
- Preserve the depth and detail of the source. Do not summarize, skip examples, or compress explanations.
- Match or slightly exceed the original length.
- Preserve natural paragraph breaks from the source structure.
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
