import Together from "together-ai";

function limitWords(text: string, maxWords: number) {
  const paragraphs = text.trim().split(/\n\s*\n/);

  let wordTotal = 0;
  const keptParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);

    if (wordTotal + words.length <= maxWords) {
      keptParagraphs.push(paragraph.trim());
      wordTotal += words.length;
    } else {
      const remainingWords = maxWords - wordTotal;

      if (remainingWords > 0) {
        keptParagraphs.push(words.slice(0, remainingWords).join(" "));
      }

      break;
    }
  }

  return keptParagraphs.join("\n\n");
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
      temperature: 1.12,
      top_p: 0.9,
      repetition_penalty: 1.25,
      max_tokens: Math.ceil(originalWords * 2),
      messages: [
        {
          role: "system",
          content: `You are a careful writing editor.

Rewrite the user's text in clear, natural English.

Strict formatting rules:
- Preserve the title on its own line.
- Preserve paragraph breaks.
- Keep one blank line between paragraphs.
- Do not merge the essay into one paragraph.
- Return only the rewritten text. Never write introductions such as "Here is another version" or "Here is the rewritten text."
- Preserve the title exactly if one exists.
- Preserve every paragraph separately.
- If the input has 5 paragraphs, the output must have exactly 5 paragraphs.
- Keep one blank line between paragraphs.
- Do not merge paragraphs into one long paragraph.
- Do not create new paragraphs.
- Keep the same main point in each matching paragraph.
- Keep the final word count close to the original, between 90% and 110%.
- Do not add facts, examples, research claims, or conclusions.
- Use simple, professional language.
- Avoid slang, filler, dramatic wording, and overly formal vocabulary.
- Do not use phrases such as "timeless practice," "holistic wellness," "in the fast-paced world," or "profound benefits."
- Return only the rewritten text.`,
        },
        {
          role: "user",
          content: `Rewrite this text exactly following the formatting rules.

The input has ${text.trim().split(/\n\s*\n/).length} paragraphs.
Your output must have the same number of paragraphs and preserve blank lines.

TEXT:
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