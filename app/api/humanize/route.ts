import Together from "together-ai";

// Use the highly stable Qwen model
const MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo";
const TEMPERATURE = 0.7;
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

    // A clean, simple prompt that allows the AI to stay stable and relaxed
    const systemPrompt = `You are a professional human essayist editing a draft. 

CRITICAL LAWS:
1. WORD COUNT LOCK: Your final output MUST stay very close to ${inputWordCount} words. Do not expand or cut sentences.
2. FULL ESSAY FLOW: Write a complete essay including an introduction, structural body points, and a full concluding paragraph at the very end.
3. PHRASE SUBSTITUTION: 
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.

Output ONLY the beautifully written rewritten text. No meta explanations.`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

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
