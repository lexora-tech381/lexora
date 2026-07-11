import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.65;
const PRESENCE_PENALTY = 0.0;
const FREQUENCY_PENALTY = 0.0;
const MAX_TOKENS = 1500;

const SYSTEM_PROMPT = `You are an expert human rewriter. You rewrite text paragraph-by-paragraph. You must maintain an informal, slightly clunky, human-like vocabulary throughout the ENTIRE document. Never slip back into formal AI phrasing.

STRICT LAWS:
1. NO FORMAL TRANSITIONS: Completely ban the words 'In conclusion', 'As a result', 'Another benefit', 'Furthermore', and 'Moreover'. 
2. UNPOLISHED PHRASING: Keep swapping out words for human equivalents ('folks', 'working position', 'heavy weight', 'internal pressure') in EVERY single paragraph, not just the first one.
3. MATCH LENGTH EXACTLY: Do not summarize or expand. Keep the exact paragraph breaks of the input text.
4. DO NOT CUT OFF: Finish every thought cleanly.

Output ONLY the rewritten text.`;

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

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      top_p: 0.85,
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
          content: SYSTEM_PROMPT,
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
