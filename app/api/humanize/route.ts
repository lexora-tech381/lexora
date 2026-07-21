import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// High-probability AI vocabulary triggers
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
  "transformative",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Improve clarity and flow while keeping the structure close to the original source.",
  Standard: "Completely re-articulate the prose into organic, unscripted human writing.",
  Academic: "Rewrite in formal academic language, avoiding generic AI filler and predictable essay structure.",
  Simple: "Use direct language, accessible vocabulary, and smooth sentences while keeping all facts.",
  Professional: "Use direct, polished, workplace-appropriate language that reads naturally.",
  Creative: "Use vivid, expressive language while preserving absolute fidelity to original details.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Authentic, conversational, articulate, and completely natural.",
  Formal: "Structured, clear, and professional.",
  Friendly: "Warm, accessible, and direct.",
  Professional: "Polished and business-ready.",
  Academic: "Analytical and precise.",
  Confident: "Direct and assured.",
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

  // Strip code blocks
  cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```$/, "").trim();

  // Strip conversational intro prefixes
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

function postProcess(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  // Replace remaining robotic AI detector triggers
  cleaned = cleaned
    .replace(/\bin today's fast-paced world\b/gi, "these days")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bplays a crucial role in\b/gi, "helps with")
    .replace(/\bfurthermore\b/gi, "also")
    .replace(/\bmoreover\b/gi, "on top of that")
    .replace(/\bin addition to\b/gi, "along with")
    .replace(/\bit is important to note that\b/gi, "keep in mind that");

  return cleaned.trim();
}

function buildSystemPrompt(
  modeName: string,
  modeInstruction: string,
  toneName: string,
  toneInstruction: string,
  targetWordCount: number,
  paragraphCount: number,
): string {
  const minWords = Math.round(targetWordCount * 0.92);
  const maxWords = Math.round(targetWordCount * 1.08);

  return `You are a professional editor transforming AI-generated text into 100% human-passing writing.

STRICT LENGTH & CONTENT RULES:
- Target length: ~${targetWordCount} words (strict range: ${minWords} to ${maxWords} words).
- Retain exact paragraph count: ${paragraphCount} paragraph(s).
- Preserve EVERY argument, fact, and detail. Do NOT summarize, shorten, or compress.

STEALTH HUMAN WRITING RULES (ELIMINATES AI DETECTION):
1. CLAUSE FLIPPING & PREPOSITIONAL LEADS:
   - AI always starts sentences with the subject: "Meditation helps...", "This practice reduces...".
   - Break this pattern! Start sentences with prepositional phrases, dependent clauses, or situational context (e.g., "By stepping back for a moment...", "When pressure builds up...", "In regular practice...").

2. BURSTINESS THROUGH NATURAL CLAUSE VARIATION:
   - Mix long explanatory sentences naturally with grounded, single-clause observations.
   - Do NOT use telegraph-style short fragments or weird punctuation like excessive em-dashes or semicolons.

3. BAN FORMULAIC ESSAY TRANSITIONS:
   - FORBIDDEN: "Additionally", "Furthermore", "Moreover", "In conclusion", "Overall", "As a result", "In summary".
   - Use plain conversational connections ("On top of that", "Beyond this", "In real terms") or transition seamlessly without transition words.

4. BANNED AI WORDS:
   - Forbidden: ${BANNED_AI_WORDS.slice(0, 20).join(", ")}.

MODE: ${modeName} (${modeInstruction})
TONE: ${toneName} (${toneInstruction})

Output ONLY the final rewritten body text. Maintain exact paragraph line breaks. No introductions, headers, or markdown wrappers.`;
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

    const wordCount = countWords(trimmedText);
    const paragraphs = trimmedText.split(/\n\s*\n/).filter(Boolean);
    const paragraphCount = Math.max(1, paragraphs.length);

    // Calculate max tokens with margin to prevent truncation
    const maxTokens = Math.min(4000, Math.max(600, Math.ceil(wordCount * 2.5)));

    const systemPrompt = buildSystemPrompt(
      resolvedMode.name,
      resolvedMode.instruction,
      resolvedTone.name,
      resolvedTone.instruction,
      wordCount,
      paragraphCount
    );

    const userMessage = `Re-articulate the concepts below using fresh vocabulary and disrupted sentence order to pass as genuine human writing. Preserve all facts and match exact word count (~${wordCount} words):

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: 0.85, // Higher sampling temperature forces unpredictable human word choices
      top_p: 0.95,
      max_tokens: maxTokens,
      presence_penalty: 0.2, // Prevents repetitive sentence openings
      frequency_penalty: 0.3, // Eliminates robotic word recycling
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const cleanedChoice = cleanOutput(rawChoice);
    const finalResult = postProcess(cleanedChoice);

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