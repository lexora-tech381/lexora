import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// Words commonly flagged by Turnitin / GPTZero / CopyLeaks
const BANNED_AI_WORDS = [
  "delve",
  "tapestry",
  "testament",
  "crucial",
  "furthermore",
  "moreover",
  "paramount",
  "pivotal",
  "underscore",
  "foster",
  "beacon",
  "multifaceted",
  "leverage",
  "interplay",
  "vital",
  "seamless",
  "embark",
  "ultimately",
];

// Robotic transitions & cliche AI phrases to filter out
const BANNED_PATTERNS = [
  "one big benefit",
  "but that's not all",
  "so what about",
  "simple yet powerful",
  "make a big difference",
  "it's a chance for your mind to rest",
  "in today's fast-paced world",
  "reap numerous benefits",
  "much-needed respite",
  "in terms of its benefits",
  "cultivate a greater sense",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Make light improvements to grammar, clarity, flow, and naturalness while keeping the original structure close to the source.",
  Standard:
    "Rewrite more fully using natural sentence variety, smoother transitions, clearer wording, and less repetitive phrasing.",
  Academic:
    "Use formal but readable academic language, logical structure, precise wording, and cautious claims. Do not invent sources, citations, evidence, or arguments.",
  Simple:
    "Use clear vocabulary, shorter sentences, and easy-to-understand phrasing while preserving all important meaning.",
  Professional:
    "Use polished, concise, workplace-appropriate language that still sounds natural.",
  Creative:
    "Use more expressive and engaging language while preserving the original message and facts.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Sound relaxed, fluent, realistic, and not overly polished.",
  Formal: "Use respectful, structured, and formal language.",
  Friendly: "Use warm, approachable, and conversational wording.",
  Professional: "Use confident, concise, and business-appropriate language.",
  Academic: "Use clear formal language suitable for university work.",
  Confident: "Use direct, assured wording without exaggeration.",
  Simple: "Use plain vocabulary and straightforward sentences.",
};

function resolveMode(mode: string): { name: string; instruction: string } {
  const instruction = MODE_INSTRUCTIONS[mode];
  if (instruction) {
    return { name: mode, instruction };
  }
  return { name: "Standard", instruction: MODE_INSTRUCTIONS.Standard };
}

function resolveTone(tone: string): { name: string; instruction: string } {
  const instruction = TONE_INSTRUCTIONS[tone];
  if (instruction) {
    return { name: tone, instruction };
  }
  return { name: "Natural", instruction: TONE_INSTRUCTIONS.Natural };
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function calculateMaxTokens(inputWordCount: number): number {
  const estimatedTokens = Math.ceil(inputWordCount * 1.8);
  return Math.min(3000, Math.max(300, estimatedTokens));
}

// Statistical calculation for Burstiness (Sentence Length Variance)
function calculateBurstiness(text: string): number {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);

  if (lengths.length <= 1) return 10; // Pass if single sentence

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  return Math.sqrt(variance); // Standard deviation
}

// Check if output contains banned AI vocabulary or patterns
function hasBannedWordsOrPatterns(text: string): boolean {
  const lower = text.toLowerCase();
  const wordCheck = BANNED_AI_WORDS.some((word) => lower.includes(word));
  const patternCheck = BANNED_PATTERNS.some((pattern) => lower.includes(pattern));
  return wordCheck || patternCheck;
}

function normalizeComparableText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) || [paragraph.trim()]
  );
}

// Remove duplicate concluding lines and appended summary tails
function removeDuplicateTailArtifacts(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return text.trim();

  // Drop trailing paragraphs that repeat earlier content
  while (paragraphs.length > 1) {
    const last = paragraphs[paragraphs.length - 1];
    const previous = paragraphs[paragraphs.length - 2];
    const lastNorm = normalizeComparableText(last);
    const previousNorm = normalizeComparableText(previous);

    const duplicatesEarlier = paragraphs.slice(0, -1).some((paragraph) => {
      const candidate = normalizeComparableText(paragraph);
      return (
        candidate === lastNorm ||
        (lastNorm.length > 40 &&
          (candidate.includes(lastNorm) || lastNorm.includes(candidate))) ||
        sentenceOverlapRatio(last, paragraph) >= 0.85
      );
    });

    if (
      duplicatesEarlier ||
      lastNorm === previousNorm ||
      sentenceOverlapRatio(last, previous) >= 0.85
    ) {
      paragraphs.pop();
      continue;
    }

    break;
  }

  // Drop duplicate ending sentences inside the final paragraph
  const finalSentences = splitSentences(paragraphs[paragraphs.length - 1]);
  while (finalSentences.length > 1) {
    const lastSentence = finalSentences[finalSentences.length - 1];
    const previousSentence = finalSentences[finalSentences.length - 2];

    if (
      normalizeComparableText(lastSentence) ===
        normalizeComparableText(previousSentence) ||
      sentenceOverlapRatio(lastSentence, previousSentence) >= 0.85
    ) {
      finalSentences.pop();
      continue;
    }

    // Also remove a closing sentence that restates an earlier sentence in the same paragraph
    const restatesEarlier = finalSentences.slice(0, -1).some(
      (sentence) => sentenceOverlapRatio(lastSentence, sentence) >= 0.9,
    );
    if (restatesEarlier) {
      finalSentences.pop();
      continue;
    }

    break;
  }

  paragraphs[paragraphs.length - 1] = finalSentences
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return paragraphs.join("\n\n");
}

function cleanOutput(text: string): string {
  let cleaned = text.trim();

  // Remove surrounding markdown code fences
  if (/^```(?:\w+)?\s*\n[\s\S]*\n```$/m.test(cleaned)) {
    cleaned = cleaned
      .replace(/^```(?:\w+)?\s*\n/, "")
      .replace(/\n```$/, "")
      .trim();
  } else {
    cleaned = cleaned
      .replace(/^```(?:\w+)?\s*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }

  // Remove short leading prefixes
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
// Replace common AI detector trigger phrases with natural human alternatives
function replaceAIDetectorTriggers(text: string): string {
  return text
    // Strip conversational filler & word inflators
    .replace(/, you know/gi, "")
    .replace(/and honestly,\s*/gi, "")
    .replace(/it's crazy how\s*/gi, "")
    .replace(/which happens to me all the time/gi, "")
    .replace(/or whatever/gi, "")
    .replace(/and all that/gi, "")
    .replace(/so yeah,\s*/gi, "")
    
    // Clean up robotic transition openings
    .replace(/emotional control's another big one/gi, "it also helps with handling your emotions")
    .replace(/it even affects your physical wellbeing/gi, "your body feels the difference too")
    
    // Standard AI cliché replacements
    .replace(/in today's fast-paced world/gi, "these days")
    .replace(/a profound impact/gi, "a real effect")
    .replace(/vying for our attention/gi, "competing for focus")
    .replace(/respite from the chaos/gi, "break from everything")
    .replace(/it's not just (.+?) that benefits/gi, "beyond just $1")
    .replace(/wreak havoc on/gi, "mess up");
}

// Clean up synthetic formatting while preserving paragraph spacing
function PostProcessHumanize(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");

  // Convert accidental literal escape sequences into real newlines
  cleaned = cleaned.replace(/\\n\\n/g, "\n\n");
  cleaned = cleaned.replace(/\\n/g, "\n");

  // Remove forced/repetitive exclamation marks
  cleaned = cleaned.replace(/!{1,}/g, ".");

  // Fix double (or more) periods caused by replacement
  cleaned = cleaned.replace(/\.{2,}/g, ".");

  // Collapse accidental double spaces (but keep paragraph breaks)
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  // Strip trailing AI artifact blocks / broken token strings
  cleaned = cleaned.replace(
    /(?:\n|^)\s*(?:```[\s\S]*$|<\|[\s\S]*$|\[\/?INST\][\s\S]*$)/gi,
    "",
  );
  cleaned = cleaned.replace(
    /\n+(?:Output|Note|Explanation|Rewritten text|Here is)[:\s][\s\S]*$/i,
    "",
  );
  cleaned = cleaned.replace(/[\s]*[^\w\s.,;:'"()\-–—?]{8,}[\s\S]*$/u, "");
  cleaned = cleaned.replace(/(?:\s*[.…]{3,}\s*)+$/g, "");

  // Normalize paragraphs to real blank-line separations
  cleaned = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/[ \t]+/g, " ")
        .replace(/\n+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");

  // Trim duplicate closing summary paragraphs / repeated ending sentences
  cleaned = removeDuplicateTailArtifacts(cleaned);

  // 1. Run the AI detector trigger replacer
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
  const minWords = Math.round(inputWordCount * 0.95);
  const maxWords = Math.round(inputWordCount * 1.02);

  return `You are a professional human editor rewriting text to read completely naturally without adding fluff or expanding length.

STRICT LENGTH CONSTRAINT:
Original word count: ${inputWordCount} words.
Your output MUST be between ${minWords} and ${maxWords} words. DO NOT inflate or bloat the word count with conversational filler.

HUMAN STYLE REQUIREMENTS:
1. NO FILLER PHRASES: Do NOT use "you know", "honestly", "it's crazy how", "which happens to me all the time", or "or whatever". Write clean, direct prose.
2. NATURAL CLAUSE VARIATION: Mix long descriptive sentences with short punchy thoughts. Merge adjacent ideas naturally instead of rewriting line-by-line.
3. BAN LISTICLE TRANSITIONS: Avoid starting paragraphs with formal signposts like "another benefit is", "it's worth noting", or "in conclusion".

Return ONLY the rewritten text without titles, quotes, or intros.`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "The rewriting service is temporarily unavailable." },
        { status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { text, mode, tone } = body as {
      text?: unknown;
      mode?: unknown;
      tone?: unknown;
    };

    if (text === undefined || text === null || typeof text !== "string") {
      return Response.json(
        { error: "Please provide valid text to rewrite." },
        { status: 400 },
      );
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return Response.json(
        { error: "Please enter text to rewrite." },
        { status: 400 },
      );
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return Response.json(
        {
          error: `Text is too long. Please keep it under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
        },
        { status: 400 },
      );
    }

    const resolvedMode = resolveMode(
      typeof mode === "string" && mode.trim() ? mode.trim() : "Standard",
    );
    const resolvedTone = resolveTone(
      typeof tone === "string" && tone.trim() ? tone.trim() : "Natural",
    );

    const inputWordCount = countWords(trimmedText);
    const inputParagraphCount = trimmedText.split(/\n\s*\n/).length;
    const maxTokens = calculateMaxTokens(inputWordCount);
    const together = new Together({ apiKey });

    const userMessage = `Completely rewrite the following text to pass as genuine human writing while matching the target length (${inputWordCount} words):

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>

Instructions:
- Do NOT output a sentence-for-sentence match. Rephrase thoughts naturally.
- Keep the paragraph structure strictly at ${inputParagraphCount} paragraphs.
- Output ONLY the final text. Do not include markdown code fences or conversational intros.`;

    let finalResult = "";
    let attempts = 0;
    const maxAttempts = 2; // Loop up to 2 times if detection checks fail

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

      const currentTemperature = isRetry ? 0.95 : 0.85;

      const response = await together.chat.completions.create({
        model: MODEL,
        temperature: currentTemperature,
        max_tokens: maxTokens,
        presence_penalty: 0.35,  // Increased from 0.2 to penalize repetitive structures
        frequency_penalty: 0.45, // Increased from 0.3 to force varied word choices
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const rawChoice = response.choices?.[0]?.message?.content || "";
      const cleanedChoice = cleanOutput(rawChoice);
      finalResult = PostProcessHumanize(cleanedChoice);

      // Calculate quality checks
      const burstinessScore = calculateBurstiness(finalResult);
      const containsBanned = hasBannedWordsOrPatterns(finalResult);
      const outputWordCount = countWords(finalResult);
      const meetsMinWordCount =
        outputWordCount >= Math.round(inputWordCount * 0.85); // Lowered threshold slightly so it doesn't fail hard

      // Accept output if valid or on final attempt
      if ((burstinessScore >= 4.0 && !containsBanned && meetsMinWordCount) || isRetry) {
        break;
      }

      attempts++;
    }

    if (!finalResult) {
      return Response.json(
        { error: "Unable to generate a rewritten result. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json(
      { error: "Unable to process text. Please try again." },
      { status: 500 },
    );
  }
}