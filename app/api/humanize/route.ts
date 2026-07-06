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
      temperature: 0.9,
      top_p: 0.9,
      presence_penalty: 0.6,
      max_tokens: Math.ceil(originalWords * 2),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: `You are an expert linguistic specialist designed to rewrite text so it completely bypasses AI detectors. Your goal is to erase all statistical trace of machine-generation by altering Perplexity and Burstiness.

Strict Algorithmic Behavior Rules:
1. SHATTER SENTENCE STRUCTURES (MAXIMIZE BURSTINESS): Introduce immense structural chaos. Mix hyper-short, blunt sentences (3 to 6 words) with long, complex, winded sentences containing multiple clauses, em-dashes (—), or parentheses. Avoid any uniform rhythmic flow.
2. BAN ALL AI GIVEAWAY PHRASES (MAXIMIZE PERPLEXITY): You are absolutely forbidden from using these robotic words: "delve", "testament", "tapestry", "moreover", "furthermore", "landscape", "meticulously", "in conclusion", "it is important to note". Swap them for conversational, raw, or precise human synonyms.
3. ELIMINATE LOGICAL BOILERPLATE: Strip out rigid transition frameworks like "Firstly", "Secondly", "Additionally", "In conclusion", and "On the other hand". Move fluidly between ideas or paragraphs using organic narrative progression or casual, direct phrasing (e.g., "That said,", "What's wild is,", "Honestly,").
4. STRUCTURAL CONSTRAINTS:
   - Return ONLY the final processed text. Do not include introductory notes, quotes, or markdown explanations.
   - Preserve the title if one exists.
   - Preserve paragraph breaks.
   - The output must have exactly ${paragraphCount} paragraphs.
   - Keep one blank line between paragraphs.
   - Do not merge paragraphs.
   - Do not add new facts, examples, claims, or conclusions.
   - Keep the length close to the original.
5. HUMAN STYLE & TONE: Write with a natural, authoritative, but slightly informal human voice. Use conversational contractions (don't, it's, can't) and stylistic nuances that mimic an experienced human writer editing a draft.`,
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