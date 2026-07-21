import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

// High-frequency AI patterns and buzzwords to avoid
const BANNED_AI_PHRASES = [
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
  "in today's fast-paced world",
  "it is important to note",
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Lightly polish the phrasing for natural flow while staying very close to the original text.",
  Standard: "Completely rephrase the text into smooth, authentic human prose while preserving every detail.",
  Academic: "Rewrite in clear, precise academic language without robotic filler or formulaic transitions.",
  Simple: "Use simple, direct language and clear sentence structures while keeping all core facts.",
  Professional: "Use direct, polished, professional tone suitable for workplace communications.",
  Creative: "Use vivid, engaging phrasing while maintaining strict accuracy to the source content.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Conversational, articulate, and completely unscripted.",
  Formal: "Structured, clear, and professional.",
  Friendly: "Warm, accessible, and direct.",
  Professional: "Business-ready, clear, and effective.",
  Academic: "Analytical, formal, and objective.",
  Confident: "Direct, assertive, and articulate.",
  Simple: "Plain, accessible, and concise.",
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
  
  // Remove accidental markdown fences
  cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```$/, "").trim();

  // Strip conversational introductory prefixes
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

  // Gentle replacements for remaining generic AI transition phrases
  cleaned = cleaned
    .replace(/\bin today's fast-paced world\b/gi, "these days")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bplays a crucial role in\b/gi, "helps with")
    .replace(/\bfurthermore\b/gi, "also")
    .replace(/\bmoreover\b/gi, "on top of that");

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
  return `You are an expert editor rewriting text so that it reads like genuine, high-quality human writing.

PRIMARY OBJECTIVES:
1. PRESERVE LENGTH & DETAIL:
   - Target word count: ~${targetWordCount} words. Keep the output length within 90% to 110% of the target.
   - Maintain approximately ${paragraphCount} paragraph(s).
   - Retain every single fact, concept, detail, and nuance from the original text. Do not summarize or cut information.

2. HUMAN STYLE & RHYTHM:
   - Write in complete, articulate, smooth sentences.
   - Vary sentence structures naturally: mix longer explanatory sentences with concise points.
   - Avoid generic robotic introductions or formulaic topic statements (e.g., "X is an important concept that...").
   - Do NOT force weird formatting like excessive semicolons, abrupt fragments, or constant em-dashes. Write fluent, cohesive paragraphs.

3. FORBIDDEN WORDS & PHRASES:
   - Avoid using these overused AI buzzwords: ${BANNED_AI_PHRASES.slice(0, 15).join(", ")}.

MODE: ${modeName} (${modeInstruction})
TONE: ${toneName} (${toneInstruction})

Output strictly the rewritten body text. No greetings, headers, intro notes, or code blocks.`;
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

    // Calculate max tokens with a healthy safety margin so output is never truncated
    const maxTokens = Math.min(4000, Math.max(600, Math.ceil(wordCount * 2.5)));

    const systemPrompt = buildSystemPrompt(
      resolvedMode.name,
      resolvedMode.instruction,
      resolvedTone.name,
      resolvedTone.instruction,
      wordCount,
      paragraphCount
    );

    const userMessage = `Rewrite the following text into smooth, complete, natural human prose. Preserve all information and match the target length (~${wordCount} words):

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: 0.70, // Ideal sweet spot for creative variety without losing coherence
      top_p: 0.90,
      max_tokens: maxTokens,
      presence_penalty: 0.1,  // Low penalty ensures smooth, natural language flow
      frequency_penalty: 0.1, // Prevents repetitive loops without causing choppy grammar
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