import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// Common words flagged by Turnitin / GPTZero / CopyLeaks
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
];

// Robotic transitions & cliché AI phrases
const BANNED_PATTERNS = [
  "one big benefit",
  "but that's not all",
  "so what about",
  "simple yet powerful",
  "make a big difference",
  "it's a chance for your mind to rest",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Make light improvements to grammar, clarity, flow, and naturalness while keeping the original structure close to the source.",
  Standard:
    "Rewrite fully using natural sentence variety, smoother transitions, clearer wording, and engaging phrasing.",
  Academic:
    "Use formal but readable academic language, logical structure, precise wording, and cautious claims. Do not invent sources, citations, evidence, or arguments.",
  Simple:
    "Use clear vocabulary, natural sentences, and easy-to-understand phrasing while preserving all important meaning.",
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
  const estimatedTokens = Math.ceil(inputWordCount * 2.2);
  return Math.min(4000, Math.max(500, estimatedTokens));
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

  // Remove short leading conversational prefixes
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

  return cleaned.trim();
}

function PostProcessHumanize(text: string): string {
  let cleaned = text;

  // Replace exclamation marks with periods to eliminate artificial enthusiasm
  cleaned = cleaned.replace(/!/g, ".");

  // Fix double periods or irregular spacing created by replacements
  cleaned = cleaned.replace(/\.\./g, ".").replace(/[ \t]+/g, " ");

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
  return `You are an expert human essayist and academic editor. Your job is to rewrite the input essay so it reads naturally like human-written work while preserving word count and paragraph formatting.

STRICT FORMATTING & LENGTH RULES:
1. PRESERVE PARAGRAPHS: The input text has approximately ${inputParagraphCount} distinct paragraphs. You MUST preserve paragraph separation by adding TWO newlines (\\n\\n) between every paragraph. DO NOT combine the text into a single block.
2. WORD COUNT MATCHING: The original document has approximately ${inputWordCount} words. Your rewritten version MUST be within 90% to 110% of this length (${Math.round(inputWordCount * 0.9)} - ${Math.round(inputWordCount * 1.1)} words). Do not cut arguments or summarize!

STRICT ANTI-DETECTION RULES:
1. NATURAL SENTENCE FLOW: Do NOT write short, choppy 5-word sentences repeatedly. Mix standard human sentences (12-22 words) with occasional shorter observations.
2. NO RUN-ON CHAINS: Do not connect whole paragraphs with endless semicolons or em-dashes.
3. NO EXCLAMATION MARKS: Do not use exclamation marks (!).
4. NO BANNED AI WORDS: Absolutely avoid using: ${BANNED_AI_WORDS.join(", ")}.
5. NO FORMULAIC TRANSITIONS: Do not start paragraphs with "Meditation also seems to...", "Another benefit is...", or "In conclusion...".

${isRetry ? "FORCEFUL RETRY: The previous draft missed paragraph breaks or altered the length. Make sure to output full paragraphs separated by blank lines, matching the original length." : ""}

SELECTED MODE: ${modeName} - ${modeInstruction}
SELECTED TONE: ${toneName} - ${toneInstruction}`;
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
    const inputParagraphs = trimmedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const inputParagraphCount = Math.max(1, inputParagraphs.length);

    const maxTokens = calculateMaxTokens(inputWordCount);
    const together = new Together({ apiKey });

    const userMessage = `Rewrite the essay below. Keep exact paragraph breaks between sections, and maintain approximately ${inputWordCount} words total.

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>

Return only the rewritten essay text. Do not include introductory or concluding notes.`;

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

      const response = await together.chat.completions.create({
        model: MODEL,
        temperature: isRetry ? 0.95 : 0.85,
        max_tokens: maxTokens,
        presence_penalty: 0.5,
        frequency_penalty: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const rawChoice = response.choices?.[0]?.message?.content || "";
      const cleanedChoice = cleanOutput(rawChoice);
      finalResult = PostProcessHumanize(cleanedChoice);

      // Verify that output word count isn't severely dropped (>80% of original)
      const outputWordCount = countWords(finalResult);
      if (outputWordCount >= Math.round(inputWordCount * 0.8)) {
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