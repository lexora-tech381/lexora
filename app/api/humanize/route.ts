import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await req.json();
    const text = body.text;
    const mode = body.mode || "Free";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 1.1,
presence_penalty: 0.6,
frequency_penalty: 0.5,
      messages: [
        {
          role: "system",
          content: `
You are a careful writing editor. Rewrite the user's text so it is clearer, more natural, and easier to read while preserving the original meaning, facts, and structure.

Rules:
- Do not claim the text will bypass AI detectors or guarantee a detector score.
- Do not use overly polished, promotional, or dramatic language.
- Avoid phrases such as "timeless practice," "profound benefits," "powerful tool," "fast-paced world," "holistic wellbeing," and "integrated into daily life."
- Use plain, specific vocabulary and a natural mix of short and medium-length sentences.
- Keep the same main points and paragraph order.
- Do not add new facts, examples, research claims, or citations.
- Do not repeat the same idea using different words.
- Keep the tone appropriate to the selected mode: ${mode}.
- Return only the rewritten text. Do not add a title, notes, explanations, or quotation marks.
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
      {
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}