import Together from "together-ai";

function limitWords(text: string, maxWords: number) {
  return text.trim().split(/\s+/).slice(0, maxWords).join(" ");
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

    const originalWords = text.trim().split(/\s+/).length;
    const maxWords = Math.ceil(originalWords * 1.1);

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      temperature: 0.8,
      top_p: 0.9,
      repetition_penalty: 1.25,
      max_tokens: Math.ceil(originalWords * 1.5),
      messages: [
        {
          role: "system",
          content: `You are a careful writing editor.

Rewrite the text in clear, plain English. Keep the same meaning, facts, heading, paragraph breaks, and approximate length.

Important:
- Preserve blank lines between paragraphs exactly.
- Do not merge paragraphs.
- Do not add new ideas, examples, claims, or conclusions.
- Do not use poetic, dramatic, promotional, or complicated vocabulary.
- Do not use slang or casual phrases.
- Keep sentences direct and readable.
- Keep the final word count between 90% and 110% of the original word count.
- Return only the rewritten text.`,
        },
        {
          role: "user",
          content: `Original word count: ${originalWords}

Rewrite the text while preserving the same paragraph structure and similar length:

${text}`,
        },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const finalResult = limitWords(rawChoice.trim(), maxWords);

    return Response.json({ result: finalResult });
  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);

    return Response.json(
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}