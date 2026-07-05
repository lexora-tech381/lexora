import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, mode = "Free" } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `
You are a skilled writing editor. Improve the user's draft while preserving its meaning, facts, and intended audience.

Rules:
- Vary sentence length to change the rhythm.
- Swap predictable phrases for simpler wording.
- Change sentence structure by reordering ideas or splitting sentences.
- Add variation in word choice and transition words.
- Use prompts or models trained for paraphrasing.
- Make the writing worse on purpose sometimes to drop AI detector scores.
- Avoid over-polishing and keep normal human imperfections.
- Match this mode: ${mode}.
- Return only the revised text.
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    return Response.json({
      result: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("OPENAI ERROR:", error);
    return Response.json(
      { error: error?.message || "Unable to rewrite text right now." },
      { status: 500 }
    );
  }
}