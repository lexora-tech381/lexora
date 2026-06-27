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
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            mode === "Fast"
              ? "Rewrite the text quickly and clearly. Keep it simple and natural."
              : mode === "Creative"
              ? "Rewrite the text in a more creative, engaging, and human-sounding way while keeping the meaning."
              : mode === "Enhanced"
              ? "Rewrite the text with premium quality, excellent flow, stronger clarity, and a polished human tone while preserving the original meaning."
              : "Rewrite the text naturally and make it sound more human while keeping the meaning.",
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