import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, mode = "Free" } = await req.json();
    if (!text?.trim()) {
      return Response.json(
        { error: "Please enter text to rewrite." },
        { status: 400 }
      );
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
      messages: [
        {
          role: "system",
          content: `
    You are a careful writing editor.
    Rewrite the user's text so it sounds clearer, more natural, and more human-edited.
    
    Rules:
    - Keep the original meaning.
    - Do not add fake facts.
    - Do not mention AI detectors.
    - Do not promise bypassing detection.
    - Avoid robotic phrasing.
    - Vary sentence length naturally.
    - Use simple, clear language.
    - Keep the tone natural, not overly polished.
    - Return only the revised text. Do not add explanations, labels, or quotation marks.
    `
        },
        {
          role: "user",
          content: text
        }
      ]
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