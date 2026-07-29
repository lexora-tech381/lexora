import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const COGNITIVE_HEDGES = [
  "appears to function primarily as",
  "arguably operates as",
  "consistently demonstrates an ability to",
  "tends to offer",
  "can be understood as",
  "broadly serves as",
] as const;

const FORMAL_CLAUSE_BRIDGES = [
  "—a metric that underscores why ",
  "—an outcome directly linked to ",
  "—a dynamic that helps explain ",
  "—a pattern that becomes clearer when ",
  "—a distinction that matters because ",
] as const;

const ASSERTION_VERBS =
  "functions?|operates?|serves?|acts?|provides?|offers?|represents?|constitutes?|remains?|lies|play|plays|demonstrates?|supports?|enhances?|improves?|enables?|facilitates?|creates?|produces?|drives?|shapes?|influences?|contributes?";

function resolveStructuralStyle(styleKey: unknown): string {
  if (styleKey === "Academic") {
    return "an expert academic scholar writing an investigative critique. You must absolutely avoid linear, predictable essay structures. Use asymmetric arguments, dense internal clause structures, and varied sentence lengths (ranging from 6 words to 35 words). Never summarize your points neatly at the end of a paragraph. Use complex vocabulary, intellectual pacing, and authoritative phrasing.";
  }

  if (styleKey === "Professional") {
    return "an expert academic scholar writing an investigative critique for a senior corporate audience. You must absolutely avoid linear, predictable essay structures. Use asymmetric arguments, dense internal clause structures, and varied sentence lengths (ranging from 6 words to 35 words). Never summarize your points neatly at the end of a paragraph. Use precise business terminology, clear data-driven pacing, and polished corporate phrasing.";
  }

  return "a clear, direct communicator explaining concepts plainly without jargon. Use asymmetric sentence rhythm and varied sentence lengths (ranging from 6 words to 35 words). Never summarize your points neatly at the end of a paragraph.";
}

function pickRandomItem<T extends readonly string[]>(items: T): T[number] {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeInlineSpacing(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/,\s*—/g, " —")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function exterminateCliches(text: string): string {
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
    "systematically enhance": "measurably improve",
    "systematically enhances": "measurably improves",
    "systematically enhanced": "measurably improved",
    mitigate: "temper",
    mitigates: "tempers",
    mitigated: "tempered",
    mitigating: "tempering",
    "substantial support": "clear backing",
    "plays a crucial role": "matters a great deal",
    "it is important to note": "worth noting",
    "it should be noted": "one detail stands out",
    "in today's world": "in current practice",
    "a wide range of": "many different",
    "in order to": "to",
    "due to the fact that": "because",
    "a significant number of": "many",
    "has the potential to": "can",
    "serves as a foundation": "grounds the discussion",
    "underscores the importance": "makes the stakes clearer",
    "highlights the need": "points to the need",
    "paves the way": "opens space",
    "at the end of the day": "in practical terms",
    "moving forward": "from here",
    "leverage": "use",
    "utilize": "use",
    "utilizes": "uses",
    "utilizing": "using",
    "facilitate": "support",
    "facilitates": "supports",
    "robust": "strong",
    "holistic": "complete",
    "paradigm": "model",
    "synergy": "coordination",
    "cutting-edge": "advanced",
    "groundbreaking": "notable",
    "in the realm of": "in",
    "a myriad of": "many",
    "plethora of": "many",
    "navigate the complexities": "handle the harder parts",
    "foster a sense of": "build",
    "shed light on": "clarify",
    "deep dive": "closer look",
    "key takeaway": "main point",
  };

  let filteredText = text;
  Object.entries(replacements).forEach(([aiWord, humanWord]) => {
    const escaped = aiWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    filteredText = filteredText.replace(regex, humanWord);
  });

  return filteredText;
}

function injectCognitiveHedges(paragraph: string): string {
  const assertionPattern = new RegExp(
    `\\b([A-Z][\\w'-]*(?:\\s+[\\w'-]+){0,4})\\s+(${ASSERTION_VERBS})\\s+(as|in|to|for|by|through|within|across)\\b`,
    "g",
  );

  let replacementCount = 0;

  return paragraph.replace(
    assertionPattern,
    (fullMatch, subject: string, _verb: string, preposition: string) => {
      // Cap hedges per paragraph to keep tone professional, not noisy
      if (replacementCount >= 2) {
        return fullMatch;
      }

      const subjectWordCount = subject.split(/\s+/).filter(Boolean).length;
      if (subjectWordCount < 1 || subjectWordCount > 5) {
        return fullMatch;
      }

      replacementCount += 1;
      const hedge = pickRandomItem(COGNITIVE_HEDGES);
      const normalizedPrep = preposition.toLowerCase();

      // If the hedge already ends with the same connector, do not duplicate it
      if (hedge.toLowerCase().endsWith(` ${normalizedPrep}`)) {
        return `${subject} ${hedge}`;
      }

      // Ability-oriented hedges prefer "to" and should not force a second connector
      if (hedge.toLowerCase().includes("ability to")) {
        return `${subject} ${hedge}`;
      }

      return `${subject} ${hedge} ${preposition}`;
    },
  );
}

function invertSyntacticStructure(paragraph: string): string {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
  let bridgeUses = 0;

  const processed = sentences.map((rawSentence) => {
    const sentence = rawSentence.trim();
    if (!sentence) {
      return sentence;
    }

    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    if (wordCount < 14) {
      return sentence;
    }

    // Prefer semicolon inversion when both clauses are substantive
    const semicolonIndex = sentence.indexOf(";");
    if (semicolonIndex > 0 && semicolonIndex < sentence.length - 1) {
      const left = sentence.substring(0, semicolonIndex).trim();
      const rightRaw = sentence.substring(semicolonIndex + 1).trim();
      const trailingPunctuation = rightRaw.match(/[.!?]+$/)?.[0] ?? "";
      const right = rightRaw.replace(/[.!?]+$/, "").trim();

      const leftWords = left.split(/\s+/).filter(Boolean).length;
      const rightWords = right.split(/\s+/).filter(Boolean).length;

      if (
        leftWords >= 5 &&
        rightWords >= 5 &&
        leftWords <= 28 &&
        rightWords <= 28
      ) {
        const invertedRight =
          left.charAt(0).toLowerCase() + left.slice(1);
        const invertedLeft =
          right.charAt(0).toUpperCase() + right.slice(1);

        return normalizeInlineSpacing(
          `${invertedLeft}; ${invertedRight}${trailingPunctuation}`,
        );
      }
    }

    // Inject a formal human bridge at a mid-sentence comma clause
    if (bridgeUses >= 2) {
      return sentence;
    }

    const commaPattern = /,\s+(?=[a-z])/g;
    let match: RegExpExecArray | null = commaPattern.exec(sentence);
    let bestMatch: RegExpExecArray | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    const midpoint = sentence.length / 2;

    while (match) {
      const distance = Math.abs(match.index - midpoint);
      const left = sentence.substring(0, match.index).trim();
      const right = sentence.substring(match.index + match[0].length).trim();
      const leftWords = left.split(/\s+/).filter(Boolean).length;
      const rightWords = right.split(/\s+/).filter(Boolean).length;

      if (leftWords >= 6 && rightWords >= 5 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = match;
      }

      match = commaPattern.exec(sentence);
    }

    if (!bestMatch || typeof bestMatch.index !== "number") {
      return sentence;
    }

    const part1 = sentence.substring(0, bestMatch.index).trim();
    const part2 = sentence.substring(bestMatch.index + bestMatch[0].length).trim();

    if (!part1 || !part2) {
      return sentence;
    }

    bridgeUses += 1;
    const bridge = pickRandomItem(FORMAL_CLAUSE_BRIDGES);
    return normalizeInlineSpacing(`${part1}${bridge}${part2}`);
  });

  return processed.join(" ").replace(/\s+/g, " ").trim();
}

function programmaticHumanizeFilter(text: string): string {
  // Pass 1: Absolute cliché extermination
  const scrubbed = exterminateCliches(text);

  // Process paragraph by paragraph to preserve essay layout
  const paragraphs = scrubbed
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const processedParagraphs = paragraphs.map((paragraph) => {
    // Pass 2: Cognitive hedge injection
    const hedged = injectCognitiveHedges(paragraph);

    // Pass 3: Syntactic structural inversion / formal clause bridging
    const inverted = invertSyntacticStructure(hedged);

    return normalizeInlineSpacing(inverted);
  });

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

    const prompt = `You are an elite human editor and writer. Your job is to rewrite the text to match the identity of ${structuralStyle}

CRITICAL BREAK LAWS:
- Ensure the text perfectly mirrors the depth and technical complexity of the input text. Do not compress information. Avoid obvious machine transitional phrases ('Furthermore', 'Moreover', 'In conclusion'), but maintain the exact level of formal sophistication required for a professional or academic setting. Use human-like varied sentence structures—mixing short assertions with complex, multi-clause explanations using semicolons and em-dashes naturally.
- You must absolutely avoid linear, predictable essay structures. Prefer asymmetric arguments, dense internal clause structures, and varied sentence lengths ranging from 6 words to 35 words.
- Never summarize your points neatly at the end of a paragraph.
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
