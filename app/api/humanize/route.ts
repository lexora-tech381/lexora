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
      model: "gpt-4o-mini",
      temperature: 1.15,
      top_p: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.8,
      messages: [
        {
          role: "system",
          content: `
    You are a careful writing editor.
    Rewrite the user's text so it sounds clearer, more natural, and more human-edited.
    
    Rules:
   - Enforce dynamic sentence contrast by tightly alternating between long descriptive clauses and very short statements.
- Prohibit structural symmetry across adjacent sentences to prevent the generation of uniform text blocks.
- Eliminate high-frequency transition terms like "furthermore," "moreover," "in conclusion," and "consequently."
- Prioritize active syntax layouts to reduce the use of rigid, passive verb phrases.
- Maintain the absolute core semantic meaning of the source input without inventing external facts.
- Apply direct, unpolished phrasing that favors conversational clarity over sterile academic or corporate prose.
- Format with clean, irregular intervals for paragraphs to break up robotic structural blocks.
- Output only the raw rewritten text without any introductory labels, tags, or formatting wrappers.
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