import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// Words commonly flagged by AI detectors
const BANNED_AI_WORDS = [
  "delve", "tapestry", "testament", "crucial", "furthermore", "moreover",
  "paramount", "pivotal", "underscore", "foster", "beacon", "multifaceted",
  "leverage", "interplay", "vital", "seamless", "embark", "ultimately",
  "invaluable", "respite", "profound", "unparalleled",
];

// Robotic transitions & cliche AI phrases
const BANNED_PATTERNS = [
  "one big benefit", "but that's not all", "so what about", "simple yet powerful",
  "make a big difference", "it's a chance for your mind to rest",
  "in today's fast-paced world", "reap numerous benefits", "much-needed respite",
  "in terms of its benefits", "cultivate a greater sense", "muscle that gets stronger",
  "so what does it all add up to",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Make light improvements to grammar, clarity, flow, and naturalness while keeping the original structure close to the source.",
  Standard:
    "Rewrite fully using completely fresh vocabulary, varied sentence structures, smooth transitions, and distinct phrasing.",
  Academic:
    "Use formal but readable academic language, logical structure, precise wording, and cautious claims. Do not invent sources, citations, or arguments.",
  Simple:
    "Use clear, plain vocabulary, short sentences, and effortless phrasing while preserving all essential meaning.",
  Professional:
    "Use polished, concise, workplace-appropriate language that sounds completely natural.",
  Creative:
    "Use expressive, vivid, and engaging phrasing while preserving the core message.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Sound relaxed, fluent, realistic, and unscripted.",
  Formal: "Use respectful, structured, and formal language.",
  Friendly: "Use warm, approachable, and conversational wording.",
  Professional: "Use confident, concise, and business-appropriate language.",
  Academic: "Use clear formal language suitable for university work.",
  Confident: "Use direct, assured wording without exaggeration.",
  Simple: "Use plain vocabulary and straightforward sentences.",
};

function resolveMode(mode: string): { name: string; instruction: string } {
  const instruction = MODE_INSTRUCTIONS[mode];
  return instruction ? { name: mode, instruction } : { name: "Standard", instruction: MODE_INSTRUCTIONS.Standard };
}

function resolveTone(tone: string): { name: string; instruction: string } {
  const instruction = TONE_INSTRUCTIONS[tone];
  return instruction ? { name: tone, instruction } : { name: "Natural", instruction: TONE_INSTRUCTIONS.Natural };
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function calculateMaxTokens(inputWordCount: number): number {
  const estimatedTokens = Math.ceil(inputWordCount * 1.8);
  return Math.min(3000, Math.max(300, estimatedTokens));
}

function calculateBurstiness(text: string): number {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  if (lengths.length <= 1) return 10;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  return Math.sqrt(variance);
}

function hasBannedWordsOrPatterns(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_AI_WORDS.some((w) => lower.includes(w)) || BANNED_PATTERNS.some((p) => lower.includes(p));
}

function normalizeComparableText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function sentenceOverlapRatio(a: string, b: string): number {
  const aWords = normalizeComparableText(a).split(" ").filter(Boolean);
  const bWords = new Set(normalizeComparableText(b).split(" ").filter(Boolean));
  if (aWords.length === 0 || bWords.size === 0) return 0;
  const overlap = aWords.filter((word) => bWords.has(word)).length;
  return overlap / Math.max(aWords.length, bWords.size);
}

function splitSentences(paragraph: string): string[] {
  return (
    paragraph
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [paragraph.trim()]
  );
}

function removeDuplicateTailArtifacts(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return text.trim();

  while (paragraphs.length > 1) {
    const last = paragraphs[paragraphs.length - 1];
    const previous = paragraphs[paragraphs.length - 2];
    const lastNorm = normalizeComparableText(last);
    const previousNorm = normalizeComparableText(previous);

    const duplicatesEarlier = paragraphs.slice(0, -1).some((p) => {
      const candidate = normalizeComparableText(p);
      return (
        candidate === lastNorm ||
        (lastNorm.length > 40 && (candidate.includes(lastNorm) || lastNorm.includes(candidate))) ||
        sentenceOverlapRatio(last, p) >= 0.85
      );
    });

    if (duplicatesEarlier || lastNorm === previousNorm || sentenceOverlapRatio(last, previous) >= 0.85) {
      paragraphs.pop();
      continue;
    }
    break;
  }

  const finalSentences = splitSentences(paragraphs[paragraphs.length - 1]);
  while (finalSentences.length > 1) {
    const lastSentence = finalSentences[finalSentences.length - 1];
    const previousSentence = finalSentences[finalSentences.length - 2];

    if (
      normalizeComparableText(lastSentence) === normalizeComparableText(previousSentence) ||
      sentenceOverlapRatio(lastSentence, previousSentence) >= 0.85
    ) {
      finalSentences.pop();
      continue;
    }

    const restatesEarlier = finalSentences.slice(0, -1).some(
      (s) => sentenceOverlapRatio(lastSentence, s) >= 0.9,
    );
    if (restatesEarlier) {
      finalSentences.pop();
      continue;
    }
    break;
  }

  paragraphs[paragraphs.length - 1] = finalSentences.join(" ").replace(/\s+/g, " ").trim();
  return paragraphs.join("\n\n");
}

function cleanOutput(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```$/, "").trim();

  const prefixes = [
    /^Here is the rewritten text:\s*/i,
    /^Rewritten version:\s*/i,
    /^Here is the humanized version:\s*/i,
    /^Here is the rewritten version:\s*/i,
    /^Humanized version:\s*/i,
    /^Rewritten text:\s*/i,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "");
  }

  cleaned = removeDuplicateTailArtifacts(cleaned);
  return cleaned.trim();
}

function replaceAIDetectorTriggers(text: string): string {
  return text
    .replace(/\bso what does it all add up to\?\s*/gi, "")
    .replace(/\bsimple yet powerful\b/gi, "practical")
    .replace(/\bmuscle that gets stronger with practice\b/gi, "skill you get better at over time")
    .replace(/\bin today's fast-paced world\b/gi, "these days")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bvying for our attention\b/gi, "competing for focus")
    .replace(/\brespite from the chaos\b/gi, "break from everything")
    .replace(/\bwreak havoc on\b/gi, "mess up")
    .replace(/\ba much-needed respite\b/gi, "a real break")
    .replace(/\btransform lives in profound ways\b/gi, "make a genuine difference")
    .replace(/\bis unparalleled\b/gi, "works surprisingly well");
}

function PostProcessHumanize(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");

  cleaned = cleaned.replace(/\\n\\n/g, "\n\n").replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/!{1,}/g, ".").replace(/\.{2,}/g, ".");
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  cleaned = cleaned.replace(/(?:\n|^)\s*(?:```[\s\S]*$|<\|[\s\S]*$|\[\/?INST\][\s\S]*$)/gi, "");
  cleaned = cleaned.replace(/\n+(?:Output|Note|Explanation|Rewritten text|Here is)[:\s][\s\S]*$/i, "");
  cleaned = cleaned.replace(/[\s]*[^\w\s.,;:'"()\-–—?]{8,}[\s\S]*$/u, "");
  cleaned = cleaned.replace(/(?:\s*[.…]{3,}\s*)+$/g, "");

  cleaned = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, " ").replace(/\n+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  cleaned = removeDuplicateTailArtifacts(cleaned);
  cleaned = replaceAIDetectorTriggers(cleaned);

  return cleaned.trim();
}

function buildSystemPrompt(
  modeName: string,
  modeInstruction: string,
  toneName: string,
  toneInstruction: string,
  inputWordCount: number,
  inputParagraphCount: number,
  isRetry: boolean = false,
): string {
  const minWords = Math.round(inputWordCount * 0.90);
  const maxWords = Math.round(inputWordCount * 1.08);

  return `You are a human writer completely rewriting a passage.

CRITICAL PARAPHRASING REQUIREMENT:
- DO NOT edit line-by-line or repeat the user's exact wording.
- Completely rephrase ideas using fresh vocabulary, altered clause ordering, and unique sentence structures.
- Imagine reading the text, understanding the core ideas, and writing it down entirely from memory.

TARGET LENGTH:
~${inputWordCount} words (range: ${minWords} to ${maxWords} words). Do not cut major ideas or add fluff.

HUMAN STYLE RULES:
1. AGGRESIVE SENTENCE VARIATION: Mix long, descriptive thoughts (20–30 words) with short, direct statements (4–7 words).
2. NO FORMULAIC INTROS/OUTROS: Avoid opening paragraphs with standard summary lines or ending with recap questions ("So what does it all add up to?").
3. BANNED VOCABULARY: Do not use "delve", "tapestry", "crucial", "vital", "invaluable", "profound", "seamless", "foster", "leverage", "simple yet powerful".

MODE: ${modeName} - ${modeInstruction}
TONE: ${toneName} - ${toneInstruction}

Return ONLY the rewritten text. No commentary, no title, no markdown.`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Service temporarily unavailable." }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { text, mode, tone } = body as { text?: unknown; mode?: unknown; tone?: unknown };

    if (text === undefined || text === null || typeof text !== "string") {
      return Response.json({ error: "Please provide valid text to rewrite." }, { status: 400 });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return Response.json({ error: "Please enter text to rewrite." }, { status: 400 });
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { error: `Text is too long. Keep under ${MAX_TEXT_LENGTH.toLocaleString()} characters.` },
        { status: 400 },
      );
    }

    const resolvedMode = resolveMode(typeof mode === "string" && mode.trim() ? mode.trim() : "Standard");
    const resolvedTone = resolveTone(typeof tone === "string" && tone.trim() ? tone.trim() : "Natural");

    const inputWordCount = countWords(trimmedText);
    const inputParagraphCount = trimmedText.split(/\n\s*\n/).length;
    const maxTokens = calculateMaxTokens(inputWordCount);
    const together = new Together({ apiKey });

    const userMessage = `Rephrase the underlying points of the source text below in a completely fresh voice. Avoid repeating exact phrasing or word choices from the source:

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>`;

    let finalResult = "";
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      const isRetry = attempts > 0;
      const systemPrompt = buildSystemPrompt(
        resolvedMode.name,
        resolvedMode.instruction,
        resolvedTone.name,
        resolvedTone.instruction,
        inputWordCount,
        inputParagraphCount,
        isRetry,
      );

      const currentTemperature = isRetry ? 0.85 : 0.75;

      const response = await together.chat.completions.create({
        model: MODEL,
        temperature: currentTemperature,
        top_p: 0.9,
        max_tokens: maxTokens,
        presence_penalty: 0.5,   // Higher penalty forces new words
        frequency_penalty: 0.5,  // Penalizes repeating source vocabulary
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const rawChoice = response.choices?.[0]?.message?.content || "";
      const cleanedChoice = cleanOutput(rawChoice);
      finalResult = PostProcessHumanize(cleanedChoice);

      const burstinessScore = calculateBurstiness(finalResult);
      const containsBanned = hasBannedWordsOrPatterns(finalResult);
      const outputWordCount = countWords(finalResult);
      const meetsMinWordCount = outputWordCount >= Math.round(inputWordCount * 0.85);

      if ((burstinessScore >= 4.0 && !containsBanned && meetsMinWordCount) || isRetry) {
        break;
      }

      attempts++;
    }

    if (!finalResult) {
      return Response.json({ error: "Unable to generate result. Try again." }, { status: 500 });
    }

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json({ error: "Unable to process text. Try again." }, { status: 500 });
  }
}