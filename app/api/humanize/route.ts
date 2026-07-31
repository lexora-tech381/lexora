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

const ADVERSARIAL_STYLE_CORE =
  "You are an elite institutional expert delivering an analytical critique of a draft. You must actively break linear machine prose loops and predictable textbook symmetry. Never organize arguments symmetrically. Mix core definitions with practical, sharp conclusions. Use highly volatile sentence variance—alternating between short structural assertions and dense compound thoughts wrapped in semicolons. Avoid predictable transitional loops like 'Furthermore', 'Moreover', and 'In conclusion'.";

const EXECUTIVE_FALLBACK_PERSONA = `${ADVERSARIAL_STYLE_CORE} Write as a senior corporate analyst delivering a critical market whitepaper. Maintain highly polished, business-aware terminology, but introduce natural structural asymmetry throughout the prose.`;

function resolveStructuralStyle(styleKey: unknown): string {
  if (typeof styleKey !== "string" || styleKey.trim().length === 0) {
    return EXECUTIVE_FALLBACK_PERSONA;
  }

  const normalized = styleKey.trim();

  if (normalized === "Academic") {
    return `${ADVERSARIAL_STYLE_CORE} Write as an expert academic scholar delivering an investigative analysis. Keep terminology highly sophisticated, dense, and intellectually authoritative without conforming to standard textbook templates.`;
  }

  if (normalized === "Professional") {
    return EXECUTIVE_FALLBACK_PERSONA;
  }

  if (
    normalized === "Friendly" ||
    normalized === "Simple" ||
    normalized === "Natural"
  ) {
    return `${ADVERSARIAL_STYLE_CORE} Write as a clear, direct corporate communicator. Prefer precise, transparent explanations while entirely bypassing machine rhythmic patterns.`;
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

CRITICAL HUMAN BYPASS LAWS:
- Structural Preservation: Output exactly one paragraph. Do not compress or truncate the core information.
- Content Integrity: Rewrite every single concept, point, and supporting detail fully. Do not omit points to save space, and do not summarize multiple thoughts into one sentence. You must match the comprehensive depth of the input text exactly, using professional terminology.
- Equal Density Phrasing: You must rewrite this isolated paragraph by fully preserving every single factual detail, idea, and concept from the source text. Do not compress multiple sentences into short summaries, and do not delete any points.
- Length Stability: Your rewritten output paragraph must match the comprehensive depth, sentence flow, and approximate size of the provided input text block exactly (Aim for a 1:1 length ratio). Maintain a highly polished, professional vocabulary without introducing fictional scenarios or shortening the descriptions. Target about ${paragraphWordCount} words.
- Zero Fictional Padding: Focus purely on humanizing the factual flow of the text provided. Do not invent external story scenarios, background settings, or sensory descriptions (such as office environments, squeaking chairs, or external noises).
- Write with unpredictable human structural flows, balancing concise multi-clause thoughts with brief 5-word declarations to shatter standard machine prose loops.
- Ensure all sophisticated corporate or academic terms are used with native fluency, avoiding linear list groups or structured conclusion summaries.
- Return ONLY the finalized rewritten paragraph content. Do not output chat text, notes, markdown formatting headers, or commentary.

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


