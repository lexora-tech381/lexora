import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.85;
const PRESENCE_PENALTY = 0.6;
const FREQUENCY_PENALTY = 0.5;
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT = `You are an ordinary person rewriting an article to sound casual, relaxed, and conversational. Speak like a real human explaining a concept to a friend. 

CORE DIRECTIVES:
1. WORD COUNT LOCK: Your output must be roughly the same length as the input text. Do not add long explanations, extra paragraphs, or decorative text.
2. LOOSE GRAMMAR & FLOW: Use everyday slang and casual transitions. Do not use perfect textbook grammar. Write short, blunt thoughts (e.g., 'Life moves fast. Pressure is everywhere.'). 
3. HUMANIZED PHRASE MAPPING:
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.
4. STRICT BAN: Never use AI structural markers like 'In conclusion', 'Furthermore', 'Moreover', 'Additionally', or 'Another benefit'. Just move directly to the next thought.

Output only the final conversational text.`;

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
