import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.9;
const TOP_P = 0.8;
const PRESENCE_PENALTY = 0.9;
const FREQUENCY_PENALTY = 0.8;
const MAX_TOKENS = 1200;

function buildSystemPrompt(inputWordCount: number) {
  return `You are a human writer typing out thoughts quickly. Your goal is to rewrite the input text paragraph-by-paragraph, maintaining the exact length, but introducing the chaotic, unpolished patterns of a real person typing on a keyboard.

EXECUTION INSTRUCTIONS:
1. LOWERCASE SHIFTING: Intentionally start roughly 20% of your sentences with a lowercase letter, especially after a period or when starting a clause (e.g., "...stays very still and calm. as the modern world moves..."). 
2. PHRASE MAPPING: Use 'folks', 'working position', 'educational institution work', 'internal pressure', and 'heavy weight' naturally across all paragraphs.
3. BAN LIST: Never use 'In conclusion', 'Furthermore', 'Moreover', 'Additionally', 'Another benefit', 'Meditation can also', or 'One of the main benefits'.
4. NO SLANG FILLER: Do not use 'and stuff' or 'you know'. Just write clear, unpolished thoughts.
5. COMPACTNESS LAWS: Your final output MUST be between ${inputWordCount - 15} and ${inputWordCount + 15} words max. Do not add extra thoughts, sentences, or fluff. You must stay tightly bound to the original length.
6. LINE INTEGRITY: Ensure every single paragraph from the input text is fully accounted for. Do not merge or omit any concepts.

Output only the rewritten text text.`;
}

function cleanOutput(text: string) {
  return text
    .replace(/I see you didn't follow[\s\S]*$/i, "")
    .replace(/Here is another version[\s\S]*?:/i, "")
    .replace(/Here is the rewritten text[\s\S]*?:/i, "")
    .replace(/^Here is[\s\S]*?:/i, "")
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, "")
    .trim();
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

    const inputWordCount = text.trim().split(/\s+/).length;
    const systemPrompt = buildSystemPrompt(inputWordCount);

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      top_p: TOP_P,
      presence_penalty: PRESENCE_PENALTY,
      frequency_penalty: FREQUENCY_PENALTY,
      max_tokens: MAX_TOKENS,
      stop: [
        "I see you",
        "Here is another version",
        "Here is the rewritten text",
      ],
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
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
