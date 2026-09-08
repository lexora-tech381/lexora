import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const CONJUNCTION_PATTERN = /\s+(and|but|so|or|because)\s+/gi;

const PARAGRAPH_TRANSITION_INSERTS = [
  " — a metric that explicitly reveals why ",
  " — which, from a tactical execution angle, means that ",
  " — a shift driven heavily by the fact that ",
  " — an operational factor that becomes evident when ",
  " — showing a clean correlation to the way ",
] as const;

const ACTIVE_VERB_STARTERS =
  /^(improve|find|enhance|reduce|support|enable|create|build|maintain|deliver|provide|offer|allow|require|include|involve|produce|drive|shape|reflect|indicate|demonstrate|operate|function|strengthen|increase|help|work|lead|promote|train|focus|balance|develop|establish|ensure|yield|generate|optimize|mitigate|foster|nurture|blunt|temper|prompt|achieve|gain|restore|protect|guide|manage|organize|clarify|simplify|expand|strengthen)\b/i;

const NATURAL_REWRITE_CORE =
  "Rewrite the user's text so it reads naturally, clearly, and fluently while preserving the original meaning and factual information.";

const EXECUTIVE_FALLBACK_PERSONA = `${NATURAL_REWRITE_CORE} Keep a professional tone: clear, precise, and polished without sounding stiff or robotic.`;

function resolveStructuralStyle(styleKey: unknown): string {
  if (typeof styleKey !== "string" || styleKey.trim().length === 0) {
    return EXECUTIVE_FALLBACK_PERSONA;
  }

  const normalized = styleKey.trim();

  if (normalized === "Academic") {
    return `${NATURAL_REWRITE_CORE} Keep an academically appropriate tone: thoughtful and precise, without sounding formulaic or artificially dense.`;
  }

  if (normalized === "Professional") {
    return EXECUTIVE_FALLBACK_PERSONA;
  }

  if (
    normalized === "Friendly" ||
    normalized === "Simple" ||
    normalized === "Natural"
  ) {
    return `${NATURAL_REWRITE_CORE} Keep a natural, approachable tone when the source allows it, without becoming excessively casual.`;
  }

  return EXECUTIVE_FALLBACK_PERSONA;
}

function applyVocabularyRandomization(text: string): string {
  // Longer high-risk expansion markers first, then broader corporate/academic scrub list
  const vocabularyMap: Array<[string, string]> = [
    ["which in turn enables", "directly allowing"],
    ["a reality highlighting why", "highlighting exactly why"],
    ["an analytical reality", "a core operational detail"],
    ["an outcome directly correlated with", "a result linked right to"],
    ["from an execution standpoint", "in day-to-day execution"],
    ["fundamentally indicating that", "effectively showing that"],
    ["tangible physiological dividends", "clear physical benefits"],
    ["substantial reinforcement", "clear backing"],
    ["systematically enhance", "measurably improve"],
    ["it is important to note", "worth noting"],
    ["the practice trains", "this routine helps"],
    ["consequently", "as a result"],
    ["moreover", "on top of that"],
    ["furthermore", "also"],
    ["ultimately", "at the end of the day"],
    [
      "functions as a disciplined cognitive methodology",
      "operates as a structured practice",
    ],
    ["optimize psychological equilibrium", "improve mental balance"],
    ["Immediate psychological stabilization", "Quick mental relief"],
    ["acute interior observation capabilities", "better self-awareness"],
    ["Longitudinal physiological benefits", "Long-term physical benefits"],
    [
      "manifesting as restored circadian rhythms",
      "showing up as better sleep cycles",
    ],
    ["Cognitive throughput concurrently sharpens", "Mental focus also sharpens"],
    ["exogenous operational pressures", "outside workspace pressures"],
    ["dampens amygdala reactivity", "calms the nervous system"],
    ["enduring stress mitigation", "lasting stress reduction"],
    ["neurocognitive conditioning", "mental conditioning"],
    ["sustained executive attention", "close attention"],
    ["metacognitive restructuring", "mental shifts"],
    ["physiological downregulation", "physical relaxation"],
    ["physiological relaxation", "physical ease"],
    ["systematic introspection", "deep reflection"],
    ["present-moment phenomena", "the task at hand"],
    ["attentional regulation", "mental focus"],
    ["measurable enhancements", "clear improvements"],
    ["sleep architecture", "sleep quality"],
    ["focusing the mind", "steadying attention"],
    ["focus the mind", "steady attention"],
    ["mental training", "focused practice"],
    ["cognitive wellness", "clearer thinking"],
    ["cognitive enhancement", "heightened focus"],
    ["cognitive resilience", "mental endurance"],
    ["effectively mitigate", "measurably reduce"],
    ["substantial support", "clear empirical backing"],
    ["due to the fact that", "because"],
    ["a significant number of", "many"],
    ["has the potential to", "can"],
    ["in the realm of", "in"],
    ["shed light on", "clarify"],
    ["key takeaway", "central implication"],
    ["In conclusion", "At the end of the day"],
    ["In summary", "In short"],
    ["Tapestry of", "Interplay of"],
    ["Testament to", "Evidence of"],
    ["Delve into", "Examine"],
    ["delving into", "examining"],
    ["simultaneously", "at the same time"],
    ["fundamentally", "at its core"],
    ["advantageous", "strategically useful"],
    ["individuals", "participants"],
    ["discipline", "practice"],
    ["mitigate", "temper"],
    ["induce", "prompt"],
    ["nurtures", "reinforces"],
    ["nurture", "reinforce"],
    ["fosters", "builds"],
    ["foster", "build"],
    ["in order to", "to"],
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
    ["cutting-edge", "advanced"],
    ["groundbreaking", "notable"],
    ["underscores the importance", "makes the stakes clearer"],
    ["highlights the need", "points to the need"],
    ["plays a crucial role", "matters a great deal"],
    ["crucial role", "central part"],
    ["best practices", "proven approaches"],
    ["going forward", "from here"],
    ["move the needle", "create measurable change"],
    ["low-hanging fruit", "easier wins"],
    ["deep dive", "closer look"],
    ["circle back", "return"],
    ["touch base", "reconnect"],
    ["bandwidth", "capacity"],
    ["ecosystem", "environment"],
    ["landscape", "field"],
    ["journey", "process"],
    ["unlock", "open"],
    ["empower", "enable"],
    ["streamline", "simplify"],
    ["optimize", "improve"],
    ["optimizes", "improves"],
    ["optimization", "improvement"],
  ];

  let randomized = text;
  vocabularyMap.forEach(([aiMarker, humanVariant]) => {
    const escaped = aiMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    randomized = randomized.replace(regex, humanVariant);
  });

  return randomized;
}

function extractSentences(paragraph: string): string[] {
  const matched = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!matched || matched.length === 0) {
    const trimmed = paragraph.trim();
    return trimmed ? [trimmed] : [];
  }

  return matched.map((sentence) => sentence.trim()).filter(Boolean);
}

function findConjunctionMatch(sentence: string): RegExpExecArray | null {
  CONJUNCTION_PATTERN.lastIndex = 0;

  let bestMatch: RegExpExecArray | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const midpoint = Math.floor(sentence.length / 2);
  let conjunctionMatch: RegExpExecArray | null =
    CONJUNCTION_PATTERN.exec(sentence);

  while (conjunctionMatch !== null) {
    if (
      typeof conjunctionMatch.index === "number" &&
      typeof conjunctionMatch[0] === "string" &&
      conjunctionMatch[0].length > 0
    ) {
      const left = sentence.substring(0, conjunctionMatch.index).trim();
      const right = sentence
        .substring(conjunctionMatch.index + conjunctionMatch[0].length)
        .trim();
      const leftWords = left.split(/\s+/).filter(Boolean).length;
      const rightWords = right.split(/\s+/).filter(Boolean).length;

      if (leftWords >= 6 && rightWords >= 6) {
        const distance = Math.abs(conjunctionMatch.index - midpoint);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = conjunctionMatch;
        }
      }
    }

    conjunctionMatch = CONJUNCTION_PATTERN.exec(sentence);
  }

  return bestMatch;
}

function pickUnusedTransitionInsert(
  usedInsertIndexes: Set<number>,
): string | null {
  const availableIndexes: number[] = [];

  for (let i = 0; i < PARAGRAPH_TRANSITION_INSERTS.length; i += 1) {
    if (!usedInsertIndexes.has(i)) {
      availableIndexes.push(i);
    }
  }

  if (availableIndexes.length === 0) {
    return null;
  }

  const selectedSlot = Math.floor(Math.random() * availableIndexes.length);
  const selectedIndex = availableIndexes[selectedSlot];
  usedInsertIndexes.add(selectedIndex);
  return PARAGRAPH_TRANSITION_INSERTS[selectedIndex];
}

function part2StartsWithActiveVerb(part2: string): boolean {
  const firstToken = (part2.trim().split(/\s+/)[0] ?? "").replace(
    /[^\w']/g,
    "",
  );
  return ACTIVE_VERB_STARTERS.test(firstToken);
}

function alignPart2AfterInsert(insert: string, part2: string): string {
  if (!part2StartsWithActiveVerb(part2)) {
    return part2;
  }

  const insertTail = (insert.trim().split(/\s+/).pop() ?? "").toLowerCase();

  // "why/when/that/way improve" → "why/when/that/way they improve"
  if (
    insertTail === "why" ||
    insertTail === "when" ||
    insertTail === "that" ||
    insertTail === "way"
  ) {
    return `they ${part2}`;
  }

  // Generic bridge for bare verbs after other transition shapes
  return `to ${part2}`;
}

function sanitizeClause(text: string): string {
  return text.replace(/\s+/g, " ").replace(/,\s*—/g, " —").trim();
}

function structuralInversionParser(paragraph: string): string {
  const sentences = extractSentences(paragraph);
  const processedSentences: string[] = [];
  const usedInsertIndexes = new Set<number>();

  for (let i = 0; i < sentences.length; i += 1) {
    const current = sentences[i];
    if (!current) {
      continue;
    }

    const wordCount = current.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 14) {
      processedSentences.push(current);
      continue;
    }

    const conjunctionMatch = findConjunctionMatch(current);

    if (
      !conjunctionMatch ||
      typeof conjunctionMatch.index !== "number" ||
      typeof conjunctionMatch[0] !== "string" ||
      conjunctionMatch[0].length === 0
    ) {
      processedSentences.push(current);
      continue;
    }

    const matchedSpan = conjunctionMatch[0];
    const matchedWord = (conjunctionMatch[1] ?? matchedSpan)
      .toLowerCase()
      .trim();
    const part1 = current.substring(0, conjunctionMatch.index).trim();
    const part2 = current
      .substring(conjunctionMatch.index + matchedSpan.length)
      .trim();

    const part1Words = part1.split(/\s+/).filter(Boolean).length;
    const part2Words = part2.split(/\s+/).filter(Boolean).length;

    if (!part1 || !part2 || part1Words < 6 || part2Words < 6) {
      processedSentences.push(current);
      continue;
    }

    const randomInsert = pickUnusedTransitionInsert(usedInsertIndexes);
    const isTooComplexForInsert =
      part2StartsWithActiveVerb(part2) &&
      (part2Words < 8 || !/\b(their|the|a|an|this|these|those|people|teams|students|professionals|organizations)\b/i.test(part2));

    // Safe fallback: clean em-dash while preserving the original conjunction
    if (!randomInsert || isTooComplexForInsert) {
      processedSentences.push(
        sanitizeClause(`${part1} — ${matchedWord} ${part2}`),
      );
      continue;
    }

    const alignedPart2 = alignPart2AfterInsert(randomInsert, part2);
    processedSentences.push(
      sanitizeClause(`${part1}${randomInsert}${alignedPart2}`),
    );
  }

  return sanitizeClause(processedSentences.join(" "));
}

function programmaticHumanizeFilter(text: string): string {
  const source = typeof text === "string" ? text : "";
  if (!source.trim()) {
    return "";
  }

  const vocabularyShattered = applyVocabularyRandomization(source);

  const paragraphs = vocabularyShattered
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const invertedParagraphs = paragraphs.map((paragraph) =>
    structuralInversionParser(paragraph),
  );

  return invertedParagraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
    .replace(/^Target\s+about\s+\d+\s+words\.?/gmi, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/,\s*—/g, " —")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readGeminiText(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "";
  }

  const maybeText = (response as { text?: unknown }).text;
  if (typeof maybeText === "string") {
    return maybeText;
  }

  if (typeof maybeText === "function") {
    try {
      const value = (maybeText as () => unknown)();
      return typeof value === "string" ? value : "";
    } catch {
      return "";
    }
  }

  return "";
}

function splitInputParagraphs(text: string): string[] {
  const doubleNewlineParagraphs = text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (doubleNewlineParagraphs.length > 1) {
    return doubleNewlineParagraphs;
  }

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildParagraphPrompt(
  systemPersona: string,
  paragraphText: string,
  paragraphIndex: number,
  totalParagraphs: number,
): string {
  const paragraphWordCount = paragraphText.split(/\s+/).filter(Boolean).length;

  return `${systemPersona}

You are rewriting paragraph ${paragraphIndex + 1} of ${totalParagraphs} from a larger document. Preserve this as exactly one paragraph.

Rewrite the user's text so it reads naturally, clearly, and fluently while preserving the original meaning and factual information.

Requirements:
1. Simplify overly formal or unnecessarily sophisticated vocabulary when a simpler natural word works better.
2. Vary sentence length and sentence structure naturally.
3. Avoid repetitive sentence patterns.
4. Avoid repetitive transitions and formulaic phrasing.
5. Make the writing flow naturally from one idea to the next.
6. Preserve the original meaning, facts, examples, numbers, names, citations, and technical terminology.
7. Never intentionally introduce grammar mistakes, spelling mistakes, awkward phrasing, or incorrect English.
8. Do not make every sentence short.
9. Do not make the text excessively casual or conversational unless the original tone is casual.
10. Avoid filler phrases such as "you know", "basically", "like", etc. unless they genuinely fit the context.
11. Remove unnecessary repetition.
12. Restructure sentences when it improves clarity and natural flow.
13. Do not add facts or information that were not in the original text.
14. Preserve the appropriate tone of the original text. Academic text should remain academically appropriate, professional text should remain professional, and casual text should remain casual.
15. The final result should be fluent, coherent, natural, and readable rather than mechanically paraphrased.

Keep roughly the same depth and coverage as the source paragraph. Target about ${paragraphWordCount} words. Rewrite the ideas fully. Do not summarize away supporting details, and do not invent extra content.

Return ONLY the rewritten text.

Text block to rewrite:
${paragraphText}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text;
    const mode = body?.mode;
    const tone = body?.tone;

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

    const styleKey =
      typeof tone === "string" && tone.trim().length > 0
        ? tone
        : typeof mode === "string" && mode.trim().length > 0
          ? mode
          : "Professional";

    const systemPersona = resolveStructuralStyle(styleKey);
    const inputParagraphs = splitInputParagraphs(trimmedText);
    const inputParagraphCount = inputParagraphs.length || 1;

    if (inputParagraphCount === 0) {
      return NextResponse.json(
        { error: "Please enter some text." },
        { status: 400 },
      );
    }

    const rewrittenParagraphs = await Promise.all(
      inputParagraphs.map(async (paragraphText, paragraphIndex) => {
        const prompt = buildParagraphPrompt(
          systemPersona,
          paragraphText,
          paragraphIndex,
          inputParagraphCount,
        );

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            temperature: 0.98,
            topP: 0.95,
          },
        });

        const rawParagraph = readGeminiText(response).trim();
        if (!rawParagraph) {
          throw new Error(
            `Empty response from Gemini engine for paragraph ${paragraphIndex + 1}.`,
          );
        }

        return rawParagraph.replace(/\n+/g, " ").trim();
      }),
    );

    const rawResult = rewrittenParagraphs.join("\n\n").trim();

    if (!rawResult) {
      return NextResponse.json(
        { error: "Empty response from Gemini engine." },
        { status: 500 },
      );
    }

    const humanizedOutput = programmaticHumanizeFilter(rawResult);

    if (!humanizedOutput) {
      return NextResponse.json(
        { error: "Failed to process rewritten content." },
        { status: 500 },
      );
    }

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


