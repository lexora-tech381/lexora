import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.95; // Higher temperature to force unique word selections
const TOP_P = 0.65; // Balanced to avoid robotic loops
const PRESENCE_PENALTY = 0.8;
const FREQUENCY_PENALTY = 0.7;
const MAX_TOKENS = 1200;

const SYSTEM_PROMPT = `You are a professional human essayist rewriting a draft to have a completely unpredictable stylistic pulse. You must eliminate all mechanical rhythms.

STRICT LAWS:
1. NO FAKE SLANG: Do not use cheap conversational filler like 'you know', 'and stuff', 'chill out', or 'like a thing'. Write naturally but with irregular structures.
2. JAGGED SENTENCE LENGTHS: Force massive variance in sentence lengths. Follow a 25-word sentence with a 3-word sentence. Disrupt the rhythmic flow intentionally.
3. STRUCTURE DESTRUCTION: Do not let paragraphs follow a parallel structural pattern. If Paragraph 1 explains a feature, Paragraph 2 should start with a direct observation or story. 
4. PERPLEXITY MAPPING:
   - Do not use: 'One of the main benefits', 'Meditation can also', 'Another benefit', 'In conclusion', 'A big benefit'. These are absolute AI giveaways.
   - Use irregular human transitions like: 'Then there is', 'The real shift happens when', 'Physically, it changes things too', 'Honestly, it just boils down to'.
5. WORD COUNT CONSTRAINT: Keep the overall text length tightly bound to the input length. Do not summarize or expand.

Output ONLY the final rewritten text.`;

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
