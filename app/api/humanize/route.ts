import Together from "together-ai";

function cleanOutput(text: string) {
  return text
    .replace(/I see you didn't follow[\s\S]*$/i, "")
    .replace(/Here is another version[\s\S]*?:/i, "")
    .replace(/Here is the rewritten text[\s\S]*?:/i, "")
    .replace(/^Here is[\s\S]*?:/i, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });

    const { text } = await req.json();

    if (!text?.trim()) {
      return Response.json(
        { error: "Please enter text to rewrite." },
        { status: 400 }
      );
    }

    const paragraphCount = text.trim().split(/\n\s*\n/).length;
    const originalWords = text.trim().split(/\s+/).length;

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      temperature: 0.55,
      top_p: 0.9,
      repetition_penalty: 1.15,
      max_tokens: Math.ceil(originalWords * 2),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: `You are a careful writing editor.

Rewrite the text in clear, natural English.

Rules:
- Return only the rewritten text.
- Do not write introductions or explanations.
- Preserve the title if one exists.
- Preserve paragraph breaks.
- The output must have exactly ${paragraphCount} paragraphs.
- Keep one blank line between paragraphs.
- Do not merge paragraphs.
- Do not add new facts, examples, claims, or conclusions.
- Keep the length close to the original.
- Use simple, professional language.
- Avoid slang, filler, dramatic wording, and overly formal vocabulary.`,
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
  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);

    return Response.json(
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}