import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.9;
const TOP_P = 0.4; // Drastically lowered to break default predictable token paths
const PRESENCE_PENALTY = 0.8; // Increased to forcefully stop AI phrase repetitions
const FREQUENCY_PENALTY = 0.7; // Increased to stop mechanical sentence flow
const MAX_TOKENS = 1200;

const SYSTEM_PROMPT = `You are a human editor. You rewrite text paragraph-by-paragraph to make it sound unpolished, casual, and conversational. Speak like a real human explaining a concept to a friend. 

CRITICAL LAWS:
1. WORD COUNT LOCK: Your output must match the exact number of paragraphs and length of the input text. Do not expand or write summaries.
2. PHRASE SUBSTITUTION MATRIX: 
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.
3. NO AI MARKERS: Absolutely ban 'In conclusion', 'Furthermore', 'Moreover', 'Additionally', or 'Another benefit'. Never use semicolons (;) or em-dashes (—).

Output ONLY the clean conversational text without any intros or outros.`;

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

    // Force-injecting the translation format directly into the user payload to override Llama's rigidity
    const formattedUserMessage = `Rewrite the following text to completely break its AI pattern. Use the phrasings: 'folks', 'working position', 'educational institution work', 'internal pressure', and 'heavy weight'. Keep the word count almost identical. Break up the sentence structures completely.

INPUT TEXT:
${text}`;

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
          content: formattedUserMessage,
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