import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_TEXT_LENGTH = 12_000;

const MODE_INSTRUCTIONS: Record<string, string> = {
  Free: "Improve clarity while maintaining close proximity to the original phrasing.",
  Standard: "Rephrase naturally with human sentence inversions, grounded phrasing, and unscripted flow.",
  Academic: "Rewrite in formal academic prose using varied passive and active structural combinations.",
  Simple: "Use plain language and direct sentences while keeping every original fact.",
  Professional: "Use clear, professional language that sounds written by a real person.",
  Creative: "Use expressive language while preserving absolute accuracy to original details.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  Natural: "Authentic, conversational, unscripted, and human.",
  Formal: "Structured, clear, and professional.",
  Friendly: "Warm, direct, and accessible.",
  Professional: "Polished and business-appropriate.",
  Academic: "Analytical and formal.",
  Confident: "Direct and assertive.",
  Simple: "Plain and accessible.",
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

function postProcess(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/[^\S\n]{2,}/g, " ");

  // Swap typical polish phrases for grounded human phrasing
  cleaned = cleaned
    .replace(/\bin today's fast-paced world\b/gi, "in busy modern life")
    .replace(/\ba profound impact\b/gi, "a real effect")
    .replace(/\bplays a crucial role in\b/gi, "helps out with")
    .replace(/\bfurthermore\b/gi, "also")
    .replace(/\bmoreover\b/gi, "on top of that")
    .replace(/\bin addition\b/gi, "along with this")
    .replace(/\bsignificant\b/gi, "noticeable");

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
  const minWords = Math.round(targetWordCount * 0.95);
  const maxWords = Math.round(targetWordCount * 1.10);

  return `You are a human writer rephrasing text to completely bypass AI detection tools.

STRICT LENGTH & PARAGRAPH RULES:
- Target word count: ~${targetWordCount} words (strict range: ${minWords} to ${maxWords} words).
- Exact paragraph count: ${paragraphCount} paragraph(s).
- Preserve EVERY argument, fact, and detail from the source. Do NOT shorten or omit information.

0% AI DETECTION REWRITE STRATEGY:
1. USE PASSIVE INVERSIONS & OBJECT-FIRST SENTENCES:
   - AI writes: "Meditation improves focus and reduces stress."
   - 0% AI writes: "Focus and stress reduction are frequently improved when meditation is practiced."
   - Frequently place the outcome or action at the beginning of the sentence rather than starting with the subject.

2. AVOID CLEAN AI VOCABULARY:
   - Do NOT use standard AI transition words: "Furthermore", "Moreover", "Additionally", "In conclusion", "Crucial", "Vital", "Tapestry", "Delve".
   - Replace generic corporate terms with descriptive human phrases (e.g., use "educational pressure" or "school duties" instead of "academic stress", "job tasks" instead of "professional responsibilities").

3. NATURAL HUMAN REPETITION & RHYTHM:
   - Allow key terms to repeat naturally across sentences rather than forcing elegant synonyms.
   - Mix long, multi-clause descriptive sentences with straightforward observations.

MODE: ${modeName} (${modeInstruction})
TONE: ${toneName} (${toneInstruction})

Output ONLY the final rewritten text. Maintain exact paragraph line breaks. No titles, intros, or markdown headers.`;
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

    const maxTokens = Math.min(4000, Math.max(600, Math.ceil(wordCount * 2.5)));

    const systemPrompt = buildSystemPrompt(
      resolvedMode.name,
      resolvedMode.instruction,
      resolvedTone.name,
      resolvedTone.instruction,
      wordCount,
      paragraphCount
    );

    const userMessage = `Re-articulate the source text below using passive sentence inversions and descriptive human phrasing. Maintain exact paragraph structure and target length (~${wordCount} words):

<SOURCE_TEXT>
${trimmedText}
</SOURCE_TEXT>`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: 0.82,
      top_p: 0.92,
      max_tokens: maxTokens,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
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