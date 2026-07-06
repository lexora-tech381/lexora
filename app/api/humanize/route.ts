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
          content: `You are an elite, human essayist and professional editor. Your goal is to rewrite the user's text into elegant, highly fluid human prose that naturally avoids AI detection patterns. Do not use cheap tricks like broken, choppy fragments or intentionally bad grammar. Write beautifully.

Strict Formatting & Multi-Paragraph Rules:
- The output must have exactly ${paragraphCount} paragraphs.
- Keep exactly one blank line between paragraphs.
- Do not merge or split the core paragraphs. Preserve the original title structure if one exists.
- Do not add new external facts, examples, or structural conclusions. Maintain the length of the original text.

Linguistic & Humanizing Directives:
1. ADVANCED STRUCTURAL FLOW (BURSTINESS): Write with absolute structural variance. Mix highly sophisticated, multi-clause, winded human sentences (using em-dashes, semicolons, or parenthetical thoughts) with occasional brief, punchy statements. Ensure the rhythm of the text constantly shifts—never let consecutive sentences follow the same pattern.
2. BAN REPETITIVE AI TERMINOLOGY (PERPLEXITY): You are completely forbidden from using predictable AI crutch words. Absolutely do not use: "delve", "testament", "tapestry", "moreover", "furthermore", "landscape", "meticulously", "in conclusion", "it is important to note", or "ultimately". Replace them with precise, nuanced vocabulary.
3. INVISIBLE TRANSITIONS: Eliminate textbook transition formulas (e.g., "Firstly", "Secondly", "Additionally", "On the other hand"). Instead, use seamless narrative bridges or mature conversational connectors (e.g., "Yet,", "In reality,", "To look closer,", "Granted,").
4. HUMAN DEPTH & VOICE: Adopt an authentic, authoritative, and deeply engaging human tone. Use natural, mature contractions (it's, that's, won't) where appropriate, but maintain the vocabulary of an educated native speaker. Avoid overly casual slang or forced text speech.

Output ONLY the finalized, heavily refined text. Do not include any introductory commentary, meta-explanations, notes, or markdown quotes.`,
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