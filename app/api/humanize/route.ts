import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.82; // Lowered to fix glitches and typos
const TOP_P = 0.75;
const PRESENCE_PENALTY = 0.5;
const FREQUENCY_PENALTY = 0.4;
const MAX_TOKENS = 1200;

function buildSystemPrompt(inputWordCount: number) {
  return `You are a professional human essayist. Your task is to completely rewrite the input text to sound natural and human, while strictly maintaining a high-quality essay structure that includes a proper introduction, body, and clear conclusion.

CRITICAL STRUCTURAL LAWS:
1. COMPLETE ESSAY STRUCTURE: Your output must have a natural flow. Ensure you include a well-written, professional conclusion paragraph at the end that sums up the thoughts naturally without using the banned word 'In conclusion'.
2. CAPS & GRAMMAR: Do not start every sentence with a lowercase letter. Use proper capitalization and standard human punctuation. Avoid massive run-on sentences. 
3. UNPREDICTABLE HUMAN FLOW: Mix short sentences (5-8 words) with medium sentences (15-20 words). This irregular rhythm is what breaks AI detectors.
4. VOCABULARY SUBSTITUTIONS: 
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.
5. WORD COUNT CONSTRAINT: Keep the final output length very close (+/- 30 words) to the original input text (${inputWordCount - 30} to ${inputWordCount + 30} words). Budget your words across all paragraphs so you do not run out of tokens before writing the conclusion.

Output ONLY the final rewritten text. No introductions or explanations.`;
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
