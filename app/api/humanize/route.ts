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
- Rewrite sentence structure, not only words.
- Use plain, natural wording.
- Vary sentence length and sentence openings.
- Remove repeated ideas and generic transitions.
- Avoid dramatic, promotional, or overly formal phrases.
- Do not add facts, sources, examples, or citations.
- Keep headings and paragraphs when useful.
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