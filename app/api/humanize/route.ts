import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// High-risk AI words that trigger detectors
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
  "highlighting",
  "emphasizing",
  "subsequently",
  "comprehensive",
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

function cleanOutput(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```$/, "").trim();

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

function postProcessHumanize(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/!{2,}/g, ".");
  cleaned = cleaned.replace(/\.{2,}/g, ".");
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  // Post-replacement for common AI transitions
  cleaned = cleaned
    .replace(/\bin today's fast-paced world\b/gi, "these days")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bplays a crucial role in\b/gi, "helps with")
    .replace(/\bmake a big difference\b/gi, "help quite a bit")
    .replace(/\bfurthermore\b/gi, "also")
    .replace(/\bmoreover\b/gi, "on top of that");

  return cleaned.trim();
}

function buildSystemPrompt(
  modeName: string,
  modeInstruction: string,
  toneName: string,
  toneInstruction: string,
  inputWordCount: number,
): string {
  const minWords = Math.max(15, Math.round(inputWordCount * 0.90));
  const maxWords = Math.round(inputWordCount * 1.10);

  return `You are a professional human editor re-writing content to bypass stealth AI detectors (GPTZero, Turnitin, CopyLeaks).

CRITICAL LENGTH & FACT RULES:
- Target length: ~${inputWordCount} words (strict range: ${minWords} to ${maxWords} words).
- Retain EVERY fact, technical term, definition, and argument. Never summarize or omit information.

EXTREME HUMANIZATION INSTRUCTIONS (FOR HIGH PERPLEXITY & BURSTINESS):
1. AGGRESSIVE SENTENCE VARIATION:
   - Alternating sentence rhythm is MANDATORY. Place a short punchy sentence (3–6 words) right next to a long, complex clause (22–32 words).
   - Use em-dashes (—), semicolons, or parenthetical remarks inside longer sentences to break robotic flow.

2. FORBIDDEN OPENINGS & PATTERNS:
   - NEVER start sentences with standard AI transitions: "Additionally", "Furthermore", "Moreover", "In conclusion", "As a result", "By doing so".
   - NEVER open paragraphs with generic topic statements like "X plays a critical role...", "Y is an important concept...", or "In today's world...".
   - Start paragraphs directly in active context, conditional clauses ("When...", "If..."), or situational examples.

3. VOCABULARY RESTRICTIONS:
   - Strictly avoid: ${BANNED_AI_WORDS.slice(0, 15).join(", ")}.
   - Write like a real person using grounded, direct language.

MODE: ${modeName} (${modeInstruction})
TONE: ${toneName} (${toneInstruction})

Output ONLY the final humanized text. Do not include intros, quote marks, or commentary.`;
}

async function humanizeChunk(
  together: Together,
  chunk: string,
  modeName: string,
  modeInstruction: string,
  toneName: string,
  toneInstruction: string,
): Promise<string> {
  const wordCount = countWords(chunk);
  const maxTokens = Math.min(2500, Math.max(300, Math.ceil(wordCount * 2.2)));

  const systemPrompt = buildSystemPrompt(
    modeName,
    modeInstruction,
    toneName,
    toneInstruction,
    wordCount
  );

  const userMessage = `Rewrite this section to read like genuine human writing. Preserve every fact and detail:

<SOURCE_TEXT>
${chunk}
</SOURCE_TEXT>`;

  const response = await together.chat.completions.create({
    model: MODEL,
    temperature: 0.82, // Higher temperature for greater unpredictability
    top_p: 0.92,
    max_tokens: maxTokens,
    presence_penalty: 0.45,
    frequency_penalty: 0.5,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const rawChoice = response.choices?.[0]?.message?.content || "";
  return postProcessHumanize(cleanOutput(rawChoice));
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
    const together = new Together({ apiKey });

    // SPLIT LONG TEXTS BY PARAGRAPHS TO PREVENT AI PATTERN DECAY
    const paragraphs = trimmedText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    let rewrittenParagraphs: string[] = [];

    // If text has multiple paragraphs and total words > 150, process paragraph by paragraph
    if (paragraphs.length > 1 && countWords(trimmedText) > 150) {
      for (const paragraph of paragraphs) {
        const rewritten = await humanizeChunk(
          together,
          paragraph,
          resolvedMode.name,
          resolvedMode.instruction,
          resolvedTone.name,
          resolvedTone.instruction
        );
        rewrittenParagraphs.push(rewritten);
      }
    } else {
      const rewritten = await humanizeChunk(
        together,
        trimmedText,
        resolvedMode.name,
        resolvedMode.instruction,
        resolvedTone.name,
        resolvedTone.instruction
      );
      rewrittenParagraphs.push(rewritten);
    }

    const finalResult = rewrittenParagraphs.join("\n\n");

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