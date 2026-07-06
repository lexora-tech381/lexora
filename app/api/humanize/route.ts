import Together from "together-ai";

function cleanOutput(text: string) {
  return text
    .replace(/I see you didn't follow[\s\S]*$/i, "")
    .replace(/Here is another version[\s\S]*?:/i, "")
    .replace(/Here is the rewritten text[\s\S]*?:/i, "")
    .replace(/^Here is[\s\S]*?:/i, "")
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY || "",
    });

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "Please enter text to rewrite." },
        { status: 400 }
      );
    }

    const paragraphCount = text.trim().split(/\n\s*\n/).length;
    const originalWords = text.trim().split(/\s+/).length;

    const userPrompt = "Take the following core data and rewrite it completely from scratch into highly natural, fluent human prose:\n\n" + text;

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      temperature: 0.95,
      top_p: 0.85,
      presence_penalty: 0.8,
      max_tokens: Math.ceil(originalWords * 2.5),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: "You are an expert human ghostwriter. Your job is to completely rewrite text so it reads beautifully, flows elegantly, and completely passes advanced AI detection models by fundamentally changing the word choices and sentence patterns.\n\n" +
          "Strict Humanizing Instructions:\n" +
          "1. ERADICATE ROBOTIC PHRASING: Do not preserve the original sentence structures. Do not start paragraphs with generic sentences like 'Meditation is a simple practice'. Instead, open with an active, fresh human angle (e.g., 'At its core, meditation doesn\\'t have to be complicated.').\n" +
          "2. ADVANCED BURSTINESS: Drastically alternate sentence patterns. Combine small ideas into deep, multi-clause human sentences using parenthetical side notes, em-dashes (—), or semicolons. Follow them up with a short, punchy truth. Never use the same structural rhythm twice in a row.\n" +
          "3. BAN CRUTCH WORDS & REPETITIONS: Never use words like 'delve', 'testament', 'tapestry', 'furthermore', 'moreover', 'in conclusion', 'ultimately', 'meticulously', 'landscape'. Do not repeatedly use transitional words like 'frankly', 'honestly', or 'basically'. Mix your conversational connectors fluidly (e.g., 'That said,', 'In reality,', 'To be fair,', 'Granted,').\n" +
          "4. STRIP OUT FORMAL INTROS/OUTROS: Completely erase summary conclusions that say 'In conclusion' or 'To summarize'. Seamlessly close the thought in the final paragraph.\n" +
          "5. FORMATTING:\n" +
          "- Return EXACTLY " + paragraphCount + " paragraphs.\n" +
          "- Keep exactly one blank line between paragraphs.\n" +
          "- Output ONLY the clean, final written prose without markdown code blocks, titles, introductions, or pleasantries."
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
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