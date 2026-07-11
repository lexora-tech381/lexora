import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.7;
const PRESENCE_PENALTY = 0.2;
const FREQUENCY_PENALTY = 0.3;

const SYSTEM_PROMPT = `You are an expert human editor. Your job is to rewrite the input text to sound natural, clean, and professional. 

CRITICAL RULES:
1. WORD COUNT CONSTRAINT: Keep the output length within +/- 10% of the input text's word count. Do not expand or fluff the content.
2. PUNCTUATION LIMITS: Never use long, winding run-on sentences. Completely ban the use of em-dashes (—) and semicolons (;) to link clauses. Use standard periods (.) to separate thoughts.
3. NATURAL SENTENCE STRUCTURE: Use clean, crisp sentences. Write like a professional human essayist—not a machine trying to look chaotic. Mix simple 6-word sentences with standard 15-word sentences.
4. ABSOLUTE VOCABULARY BAN: Do not use: 'in today's world', 'frenetic world', 'navigating the demands', 'testament', 'delve', 'moreover', 'furthermore', 'tapestry'.
5. OUTPUT DIRECTION: Output ONLY the clean, final edited text. No intros or outros.`;

function cleanOutput(text: string) {
  return text
    .replace(/I see you didn't follow[\s\S]*$/i, "")
    .replace(/Here is another version[\s\S]*?:/i, "")
    .replace(/Here is the rewritten text[\s\S]*?:/i, "")
    .replace(/^Here is[\s\S]*?:/i, "")
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, "")
    .trim();
}

function buildUserPrompt(text: string, paragraphCount: number, wordCount: number) {
  return [
    "Rewrite the following text. Keep the output within +/- 10% of the input word count.",
    `Input word count: ${wordCount}. Return exactly ${paragraphCount} paragraph(s) with one blank line between each.`,
    "",
    text,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY || "",
    });

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "Please enter text to rewrite." },
        { status: 400 },
      );
    }

    const paragraphCount = text.trim().split(/\n\s*\n/).length;
    const originalWords = text.trim().split(/\s+/).length;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      top_p: 0.85,
      presence_penalty: PRESENCE_PENALTY,
      frequency_penalty: FREQUENCY_PENALTY,
      max_tokens: Math.ceil(originalWords * 1.2),
      stop: [
        "I see you",
        "Here is another version",
        "Here is the rewritten text",
      ],
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildUserPrompt(text, paragraphCount, originalWords),
        },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const finalResult = cleanOutput(rawChoice);

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process text at this time.";
    console.error("TOGETHER API ERROR:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
