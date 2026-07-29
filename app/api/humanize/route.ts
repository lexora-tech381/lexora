import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const STRUCTURAL_MODIFIERS = [
  " — ",
  " — a point that clarifies why ",
  " — which in practice means ",
  " — driven by the fact that ",
  " — a distinction that matters because ",
  " — an outcome tied to ",
] as const;

const CONJUNCTION_PATTERN =
  /\b(and|but|so|or|although|while|because|though)\b/gi;

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

  if (normalized === "Friendly" || normalized === "Simple" || normalized === "Natural") {
    return `${ADVERSARIAL_STYLE_CORE} Write as a clear, direct corporate communicator. Prefer precise, transparent explanations while entirely bypassing machine rhythmic patterns.`;
  }

  // Unknown tone/mode → never leave persona undefined
  return EXECUTIVE_FALLBACK_PERSONA;
}

function pickAlternateModifierIndex(lastUsedIndex: number): number {
  if (STRUCTURAL_MODIFIERS.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * STRUCTURAL_MODIFIERS.length);
  if (nextIndex === lastUsedIndex) {
    nextIndex = (nextIndex + 1) % STRUCTURAL_MODIFIERS.length;
  }

  return nextIndex;
}

function applyVocabularyRandomization(text: string): string {
  const vocabularyMap: Array<[string, string]> = [
    ["functions as a disciplined cognitive methodology", "operates as a structured practice"],
    ["optimize psychological equilibrium", "improve mental balance"],
    ["Immediate psychological stabilization", "Quick mental relief"],
    ["acute interior observation capabilities", "better self-awareness"],
    ["Longitudinal physiological benefits", "Long-term physical benefits"],
    ["manifesting as restored circadian rhythms", "showing up as better sleep cycles"],
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
    ["systematically enhance", "measurably improve"],
    ["substantial support", "clear empirical backing"],
    ["it is important to note", "worth noting"],
    ["due to the fact that", "because"],
    ["a significant number of", "many"],
    ["has the potential to", "can"],
    ["in the realm of", "in"],
    ["shed light on", "clarify"],
    ["key takeaway", "central implication"],
    ["In conclusion", "Ultimately"],
    ["Furthermore", "Also"],
    ["Moreover", "Beyond that"],
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
    ["at the end of the day", "in practical terms"],
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

function clauseNeedsSimpleEmDash(rawPart2: string): boolean {
  const leading = rawPart2.trim().split(/\s+/).slice(0, 3).join(" ");
  return /^(while|when|which|because|that|although|though|where|whereas|and|but|so|or)\b/i.test(
    leading,
  );
}

function clauseHasStrongVerb(rawPart2: string): boolean {
  const cleaned = rawPart2.replace(/[.!?]+$/g, "").trim();
  const tokenCount = cleaned.split(/\s+/).filter(Boolean).length;
  if (tokenCount < 4) {
    return false;
  }

  return /\b(is|are|was|were|be|been|being|has|have|had|will|would|can|could|may|might|shall|should|must|do|does|did|provides?|supports?|enables?|creates?|builds?|improves?|remains?|offers?|allows?|requires?|includes?|involves?|produces?|drives?|shapes?|reflects?|indicates?|demonstrates?|operates?|functions?|delivers?|strengthens?|reduces?|increases?|maintains?|helps?|works?|leads?)\b/i.test(
    cleaned,
  );
}

function findBestConjunctionSplit(
  sentence: string,
): { index: number; word: string; length: number } | null {
  CONJUNCTION_PATTERN.lastIndex = 0;

  let best: { index: number; word: string; length: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const midpoint = Math.floor(sentence.length / 2);
  let match: RegExpExecArray | null = CONJUNCTION_PATTERN.exec(sentence);

  while (match !== null) {
    const index = match.index;
    const word = match[1] ?? match[0];
    const length = match[0].length;

    // Require meaningful content on both sides
    if (index > 12 && index + length < sentence.length - 12) {
      const left = sentence.substring(0, index).trim();
      const right = sentence.substring(index + length).trim();
      const leftWords = left.split(/\s+/).filter(Boolean).length;
      const rightWords = right.split(/\s+/).filter(Boolean).length;

      if (leftWords >= 4 && rightWords >= 3) {
        const distance = Math.abs(index - midpoint);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { index, word, length };
        }
      }
    }

    match = CONJUNCTION_PATTERN.exec(sentence);
  }

  return best;
}

function structuralInversionParser(
  paragraph: string,
  lastModifierIndexRef: { value: number },
): string {
  const sentences = extractSentences(paragraph);
  const processed: string[] = [];

  for (let i = 0; i < sentences.length; i += 1) {
    const current = sentences[i];
    if (!current) {
      continue;
    }

    const wordCount = current.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 14) {
      processed.push(current);
      continue;
    }

    const split = findBestConjunctionSplit(current);
    if (!split) {
      processed.push(current);
      continue;
    }

    const part1 = current.substring(0, split.index).trim();
    const rawPart2 = current.substring(split.index + split.length).trim();

    if (!part1 || !rawPart2) {
      processed.push(current);
      continue;
    }

    let bridge = " — ";
    const conjunctionWord = split.word.toLowerCase();

    if (
      clauseNeedsSimpleEmDash(rawPart2) ||
      !clauseHasStrongVerb(rawPart2) ||
      conjunctionWord === "although" ||
      conjunctionWord === "while" ||
      conjunctionWord === "because" ||
      conjunctionWord === "though"
    ) {
      // Keep original conjunction to avoid verb drops / run-ons
      bridge = ` — ${conjunctionWord} `;
    } else {
      const modifierIndex = pickAlternateModifierIndex(lastModifierIndexRef.value);
      lastModifierIndexRef.value = modifierIndex;
      bridge = STRUCTURAL_MODIFIERS[modifierIndex] ?? " — ";
    }

    processed.push(
      `${part1}${bridge}${rawPart2}`
        .replace(/\s+/g, " ")
        .replace(/,\s*—/g, " —")
        .trim(),
    );
  }

  return processed
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/,\s*—/g, " —")
    .trim();
}

function programmaticHumanizeFilter(text: string): string {
  const source = typeof text === "string" ? text : "";
  if (!source.trim()) {
    return "";
  }

  const vocabularyShattered = applyVocabularyRandomization(source);
  const lastModifierIndexRef = { value: -1 };

  const paragraphs = vocabularyShattered
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const invertedParagraphs = paragraphs.map((paragraph) =>
    structuralInversionParser(paragraph, lastModifierIndexRef),
  );

  return invertedParagraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
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

  // Some SDK shapes expose text as a getter function
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

    const prompt = `${systemPersona}

CRITICAL HUMAN BYPASS LAWS:
- You must match or slightly exceed the analytical depth and length of the original text. Do not compress information.
- Write with unpredictable human structural flows, balancing long multi-clause insights with sharp, shorter declarations.
- Ensure all sophisticated corporate or academic terms are used with native fluency, avoiding linear list groups or structured conclusion summaries.
- Never invent fictional sensory scenes, office noises, or unrelated narrative padding.
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

    const rawResult = readGeminiText(response).trim();

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
