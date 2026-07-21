import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// Words heavily flagged by AI detectors
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
  "invaluable",
  "respite",
  "profound",
  "unparalleled",
  "increasingly",
];

const BANNED_PATTERNS = [
  "in today's fast-paced world",
  "plays a crucial role",
  "it is important to note",
  "so what does it all add up to",
  "simple yet powerful",
  "a chance for your mind to rest",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Make light improvements to flow and naturalness while keeping the sentence structure close to the original.",
  Standard: "Rewrite thoroughly using natural phrasing, organic sentence variety, and conversational flow.",
  Academic: "Rewrite in clear, formal academic prose without robotic filler or generic topic openings.",
  Simple: "Use clear, plain language and simple sentences while keeping every core detail.",
  Professional: "Use direct, professional language that sounds natural and written by an experienced human.",
  Creative: "Use engaging, vivid language while preserving all original facts.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Relaxed, authentic, and completely unscripted.",
  Formal: "Structured, clear, and professional.",
  Friendly: "Warm, conversational, and direct.",
  Professional: "Polished and business-appropriate.",
  Academic: "Analytical and precise.",
  Confident: "Direct and assertive.",
  Simple: "Plain and clear.",
};

function resolveMode(mode: string): { name: string; instruction: string } {
  const instruction = MODE_INSTRUCTIONS[mode];
  return { name: instruction ? mode : "Standard", instruction: instruction || MODE_INSTRUCTIONS.Standard };
}

function resolveTone(tone: string): { name: string; instruction: string } {
  const instruction = TONE_INSTRUCTIONS[tone];
  return { name: instruction ? tone : "Natural", instruction: instruction || TONE_INSTRUCTIONS.Natural };
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function calculateMaxTokens(inputWordCount: number): number {
  const estimatedTokens = Math.ceil(inputWordCount * 2.2);
  return Math.min(3500, Math.max(400, estimatedTokens));
}

function cleanOutput(text: string): string {
  let cleaned = text.trim();

  // Strip code blocks
  cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```$/, "").trim();

  // Strip prefix conversational headers
  const prefixes = [
    /^Here is the rewritten text:\s*/i,
    /^Rewritten version:\s*/i,
    /^Here is the humanized version:\s*/i,
    /^Humanized version:\s*/i,
    /^Rewritten text:\s*/i,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "");
  }

  return cleaned.trim();
}

function replaceAIDetectorTriggers(text: string): string {
  return text
    .replace(/\bin today's fast-paced world\b/gi, "these days")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bplays a crucial role in\b/gi, "helps with")
    .replace(/\bmake a big difference\b/gi, "help quite a bit");
}

function postProcessHumanize(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/!{2,}/g, ".");
  cleaned = cleaned.replace(/\.{2,}/g, ".");
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  cleaned = replaceAIDetectorTriggers(cleaned);
  return cleaned.trim();
}

function buildSystemPrompt(
  modeName: string,
  modeInstruction: string,
  toneName: string,
  toneInstruction: string,
  inputWordCount: number,
): string {
  const minWords = Math.max(15, Math.round(inputWordCount * 0.88));
  const maxWords = Math.round(inputWordCount * 1.12);

  return `You are an expert human editor re-writing text so it passes stealth AI detectors (Turnitin, GPTZero, CopyLeaks).

CRITICAL REQUIREMENT - ZERO INFORMATION LOSS & ACCURATE LENGTH:
- Length Target: ~${inputWordCount} words (Allowed range: ${minWords} to ${maxWords} words).
- You MUST retain EVERY single fact, definition, method, and concept from the source text. Do NOT summarize or drop details.

ANTI-DETECTION RULES (PERPLEXITY & BURSTINESS):
1. VARY SENTENCE LENGTHS DRAMATICALLY:
   - Combine a long, detailed sentence containing natural punctuation (em-dashes, commas, or parentheses) with a short, direct sentence (4–7 words).
2. NEVER START WITH DEFINITION PATTERNS:
   - FORBIDDEN OPENINGS: Do not start with "[Topic] is a...", "In today's...", "It helps people...", or "This practice allows...".
   - Instead, start with an action, a situational context, or a dependent clause.
3. SPOKEN TRANSITIONS ONLY:
   - BANNED: "Furthermore", "Moreover", "Additionally", "In conclusion", "Crucial", "Tapestry", "Delve", "Increasingly".
   - USE: "On top of that", "In practice", "Instead", "Beyond that", or no transitional phrase at all.
4. HUMAN PERPLEXITY:
   - Restructure sentence orders naturally rather than translating phrase-by-phrase.

MODE: ${modeName} (${modeInstruction})
TONE: ${toneName} (${toneInstruction})

Output ONLY the rewritten body text. No intro, no chat, no markdown fences.`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "The rewriting service is temporarily unavailable." },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { text, mode, tone } = body as {
      text?: unknown;
      mode?: unknown;
      tone?: unknown;
    };

    if (typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "Please enter valid text to rewrite." },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { error: `Text exceeds character limit of ${MAX_TEXT_LENGTH.toLocaleString()}.` },
        { status: 400 }
      );
    }

    const resolvedMode = resolveMode(typeof mode === "string" ? mode.trim() : "Standard");
    const resolvedTone = resolveTone(typeof tone === "string" ? tone.trim() : "Natural");

    const inputWordCount = countWords(trimmedText);
    const maxTokens = calculateMaxTokens(inputWordCount);
    const together = new Together({ apiKey });

    const systemPrompt = buildSystemPrompt(
      resolvedMode.name,
      resolvedMode.instruction,
      resolvedTone.name,
      resolvedTone.instruction,
      inputWordCount
    );

    const userMessage = `Rewrite this text to sound written by a real human while retaining ALL original facts and details:

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: 0.72,
      top_p: 0.92,
      max_tokens: maxTokens,
      presence_penalty: 0.3,
      frequency_penalty: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const cleanedChoice = cleanOutput(rawChoice);
    const finalResult = postProcessHumanize(cleanedChoice);

    if (!finalResult) {
      return Response.json(
        { error: "Failed to generate humanized text. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json(
      { error: "Unable to process text. Please try again." },
      { status: 500 }
    );
  }
}