import Together from "together-ai";

// Verified serverless model path on Together AI
const MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo";
const TEMPERATURE = 0.85;
const TOP_P = 0.8;
const PRESENCE_PENALTY = 0.6;
const FREQUENCY_PENALTY = 0.5;
const MAX_TOKENS = 1200;

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

    const systemPrompt = `You are a professional human essayist editing a draft. Your objective is to rewrite the input text to sound entirely spontaneous, natural, and human while following strict structural rules.

CRITICAL LAWS:
1. WORD COUNT LOCK: Your final output MUST be tightly budgeted between ${inputWordCount - 15} and ${inputWordCount + 15} words max. Do not expand, summarize, or write filler.
2. FULL ESSAY FLOW: You must write a complete essay. This includes a clear opening section, descriptive body points, and a full conclusion paragraph at the end. Do not use the phrase 'In conclusion'.
3. NATURAL SENTENCE JUGGLING: Intentionally vary sentence lengths. Mix very short sentences (4-7 words) with standard sentences. Avoid uniform, perfectly balanced phrasing.
4. PHRASE SUBSTITUTION MATRIX: 
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.

Output ONLY the final rewritten text. No introductions or explanations.`;

    const response = await together.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        top_p: TOP_P,
        presence_penalty: PRESENCE_PENALTY,
        frequency_penalty: FREQUENCY_PENALTY,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      },
      {
        // Cache-busting mechanism to forcefully clear stuck backend errors
        headers: {
          "X-Cache-Buster": Date.now().toString(),
        },
      },
    );

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const finalResult = cleanOutput(rawChoice);

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to process text.";
    console.error("TOGETHER API ERROR:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
