import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

const CLAUSE_TRANSITIONS = [
  " — an analytical reality highlighting why ",
  " — which, from an execution standpoint, implies that ",
  " — driven primarily by the fact that ",
  " — a structural factor that becomes clear when ",
  " — which effectively points to ",
  " — an outcome directly correlated with the reality that ",
] as const;

const SIMPLE_CONJUNCTIONS = [" and ", " but ", " so ", " or "] as const;

const SUBORDINATE_STARTERS =
  /^(while|when|which|because|that|where|whereas|although|though|unless|until|after|before|since|if|as|and|but|so|or)\b/i;

const STRONG_VERB_PATTERN =
  /\b(is|are|was|were|be|been|being|has|have|had|will|would|can|could|may|might|shall|should|must|do|does|did|provides?|supports?|enables?|creates?|builds?|improves?|remains?|offers?|allows?|requires?|includes?|involves?|produces?|drives?|shapes?|reflects?|indicates?|demonstrates?|operates?|functions?|delivers?|strengthens?|reduces?|increases?|maintains?|establishes?|ensures?|yields?|generates?|helps?|works?|leads?|depends?|matters?)\b/i;

const ADVERSARIAL_STYLE_CORE =
  "You are an institutional expert rewriting a document. Completely sabotage traditional linear essay structures while remaining factual and professional. Write with high structural asymmetry. Never conclude a paragraph with a summary statement. Leave paragraphs hanging on an active analytical point drawn only from the source material. Vary sentence lengths. Force some paragraphs to begin with a short blunt declaration, followed by a longer multi-clause sentence tied together by a semicolon or an em-dash. Avoid predictable transitional loops like 'Furthermore', 'Moreover', and 'In conclusion'.";

const EXECUTIVE_PROSE_LAW =
  "Write with the analytical precision of an institutional whitepaper author, but prioritize active direct verbs over passive clinical jargon. Keep the prose sophisticated, authoritative, and clean.";

function resolveStructuralStyle(styleKey: unknown): string {
  if (styleKey === "Academic") {
    return `${ADVERSARIAL_STYLE_CORE} ${EXECUTIVE_PROSE_LAW} Write as an expert academic scholar delivering an investigative analysis. Keep terminology authoritative without clinical density or textbook templates.`;
  }

  if (styleKey === "Professional") {
    return `${ADVERSARIAL_STYLE_CORE} ${EXECUTIVE_PROSE_LAW} Write as a senior corporate analyst delivering a critical market whitepaper. Maintain polished business terminology with natural structural asymmetry.`;
  }

  return `${ADVERSARIAL_STYLE_CORE} Write as a clear, direct corporate communicator. Prefer precise, transparent explanations while bypassing machine rhythmic patterns.`;
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
  // Longer phrases first so multi-word clinical markers win over shorter overlaps
  const vocabularyMap: Array<[string, string]> = [
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
    ["systematic introspection", "deep reflection"],
    ["present-moment phenomena", "the task at hand"],
    ["attentional regulation", "mental focus"],
    ["measurable enhancements", "clear improvements"],
    ["sleep architecture", "sleep quality"],
    ["fundamentally indicating that", "which effectively points to"],
    ["effectively mitigate", "measurably reduce"],
    ["cognitive enhancement", "heightened focus"],
    ["cognitive resilience", "mental endurance"],
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
    return [paragraph.trim()].filter(Boolean);
  }

  return matched.map((sentence) => sentence.trim()).filter(Boolean);
}

function findSimpleConjunctionIndex(sentence: string): number {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  const midpoint = Math.floor(sentence.length / 2);

  for (let i = 0; i < SIMPLE_CONJUNCTIONS.length; i += 1) {
    const conjunction = SIMPLE_CONJUNCTIONS[i];
    let searchFrom = 0;

    while (searchFrom < sentence.length) {
      const foundAt = sentence.indexOf(conjunction, searchFrom);
      if (foundAt === -1) {
        break;
      }

      if (foundAt > 20 && foundAt < sentence.length - 20) {
        const distance = Math.abs(foundAt - midpoint);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = foundAt;
        }
      }

      searchFrom = foundAt + conjunction.length;
    }
  }

  return bestIndex;
}

function clauseNeedsSimpleConnector(rawPart2: string): boolean {
  const leadingWindow = rawPart2.trim().split(/\s+/).slice(0, 4).join(" ");

  if (SUBORDINATE_STARTERS.test(leadingWindow)) {
    return true;
  }

  return /\b(while|when|which|because|that)\b/i.test(leadingWindow);
}

function clauseHasStrongVerb(rawPart2: string): boolean {
  const cleaned = rawPart2.replace(/[.!?]+$/g, "").trim();
  const tokenCount = cleaned.split(/\s+/).filter(Boolean).length;

  // Noun-phrase tails like "sustained quiet reflection" lack clause force
  if (tokenCount < 5) {
    return false;
  }

  return STRONG_VERB_PATTERN.test(cleaned);
}

function resolveTransitionBridge(
  conjunctionWord: string,
  rawPart2: string,
  lastTransitionIndexRef: { value: number },
): string {
  const isComplexTail =
    clauseNeedsSimpleConnector(rawPart2) || !clauseHasStrongVerb(rawPart2);

  // Keep original conjunction with a clean em-dash when grammar is already dense
  if (isComplexTail) {
    return ` — ${conjunctionWord} `;
  }

  const transitionIndex = pickAlternateTransitionIndex(
    lastTransitionIndexRef.value,
  );
  lastTransitionIndexRef.value = transitionIndex;
  return CLAUSE_TRANSITIONS[transitionIndex];
}

function fractureLongSentences(
  paragraph: string,
  lastTransitionIndexRef: { value: number },
): string {
  const sentences = extractSentences(paragraph);
  const processedSentences: string[] = [];

  for (let i = 0; i < sentences.length; i += 1) {
    const current = sentences[i].trim();
    if (!current) {
      continue;
    }

    const words = current.split(/\s+/).filter(Boolean);
    if (words.length > 16) {
      const conjunctionIndex = findSimpleConjunctionIndex(current);

      if (conjunctionIndex > 0) {
        const part1 = current.substring(0, conjunctionIndex).trim();
        // Capture the full remainder so nothing after the conjunction is dropped
        const remainder = current.substring(conjunctionIndex).trim();
        const remainderTokens = remainder.split(/\s+/).filter(Boolean);
        const conjunctionWord = (remainderTokens[0] ?? "")
          .replace(/[^\w']/g, "")
          .toLowerCase();
        const rawPart2 = remainderTokens.slice(1).join(" ").trim();

        if (
          part1 &&
          rawPart2 &&
          (conjunctionWord === "and" ||
            conjunctionWord === "but" ||
            conjunctionWord === "so" ||
            conjunctionWord === "or")
        ) {
          const transition = resolveTransitionBridge(
            conjunctionWord,
            rawPart2,
            lastTransitionIndexRef,
          );

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

function splitPreservedParagraphs(text: string): string[] {
  // Strict double-newline split preserves Gemini's paragraph layout
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

function programmaticHumanizeFilter(text: string): string {
  const vocabularyShattered = applyVocabularyRandomization(text);
  const lastTransitionIndexRef = { value: -1 };

  const paragraphs = splitPreservedParagraphs(vocabularyShattered);

  const processedParagraphs = paragraphs.map((paragraph) =>
    fractureLongSentences(paragraph, lastTransitionIndexRef),
  );

  return processedParagraphs
    .join("\n\n")
    .replace(/^#+\s*/gm, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/,\s*—/g, " —")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
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

    const inputParagraphs = splitPreservedParagraphs(trimmedText);
    const inputParagraphCount = Math.max(inputParagraphs.length, 1);
    const inputSentenceCount = inputParagraphs.reduce((total, paragraph) => {
      const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g);
      if (sentences && sentences.length > 0) {
        return total + sentences.length;
      }
      return total + 1;
    }, 0);
    const inputWordCount = trimmedText.split(/\s+/).filter(Boolean).length;

    const prompt = `You are rewriting the draft below.

Identity and method:
${structuralStyle}

CRITICAL HUMAN BYPASS LAWS:
- Structure Requirement: You must output exactly ${inputParagraphCount} paragraphs, matching the exact paragraph count of the input text. Separate paragraphs with a blank line (double newline). Do not merge paragraphs. Do not invent extra paragraphs.
- Expansion Directive: For every single sentence in the original text, you must write a fully developed, sophisticated professional counterpart. Never combine multiple sentences into one short summary. Expand on the conceptual mechanics of the input text using authoritative business whitepaper terminology to ensure the output word count matches or slightly exceeds the original.
- Absolute Sentence-for-Sentence Structure: The input contains approximately ${inputSentenceCount} sentences and ${inputWordCount} words. Your rewrite must cover each source sentence with its own fully developed counterpart so the output stays within ±10% of ${inputWordCount} words and never collapses into a miniature summary.
- Strict Length Guard: Never summarize. Never compress detailed explanations. Absolutely do not invent new scenarios, external settings, or fictional background descriptions.
- Professional Boundaries: Maintain an authoritative, institutional whitepaper tone. Do not introduce narrative storytelling elements like squeaking chairs, office rooms, microwave beeps, leftover food, fluorescent lighting, or background noises. Focus entirely on humanizing the structural flow of the actual data provided.
- Completely sabotage traditional linear essay structures without adding new facts.
- Write with high structural asymmetry using only the source content.
- Never conclude a paragraph with a summary statement.
- Leave paragraphs hanging on an active analytical point drawn from the source, and begin the next paragraph mid-thought when that stays factual.
- Vary sentence lengths. Begin some paragraphs with a short blunt declaration, then continue with a longer multi-clause sentence using a semicolon or em-dash.
- Maintain sophisticated, authoritative terminology without clinical jargon density.
- Prioritize active direct verbs over passive clinical phrasing.
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
