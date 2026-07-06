import Together from "together-ai";

function injectHumanPerplexity(text: string): string {
  const fillers = [" honestly, ", " basically, ", " essentially, ", ", surprisingly, ", " frankly, "];
  let paragraphs = text.split(/\n\s*\n/);

  paragraphs = paragraphs.map((para) => {
    let sentences = para.split(/(?<=[.!?])\s+/);
    // Safely inject filler into the second sentence of the paragraph if it exists
    if (sentences.length >= 2 && sentences[1]) {
      const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
      const targetSentence = sentences[1];
      
      const formattedSentence = randomFiller.trimStart() + " " + targetSentence.charAt(0).toLowerCase() + targetSentence.slice(1);
      sentences[1] = formattedSentence;
    }
    return sentences.join(" ");
  });

  return paragraphs.join("\n\n");
}

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

    // Safe string building to avoid template literal escaping issues on your system
    const userPrompt = "Rewrite the following text into standard, straightforward, casual human writing. Remove any mechanical structures. Keep the same exact facts:\n\n" + text;

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      temperature: 0.95,
      top_p: 0.8,
      presence_penalty: 0.7,
      max_tokens: Math.ceil(originalWords * 2),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: "You are an average, everyday human editor rewriting a rough draft. Avoid sounding smart, academic, or overly literary. Speak with simple, plain human clarity.\n\nStrict Rules:\n1. NO DRAMATIC LANGUAGE: Absolutely ban words like 'cacophony', 'cornucopia', 'veritable', 'tapestry', 'delve', 'testament', 'journey', 'moreover', 'furthermore', 'landscape', 'meticulously', 'in conclusion', 'it is important to note', or 'ultimately'.\n2. NATURAL HUMAN VARIANCE: Write using conversational rhythms. Use short sentences mixed with conversational, mid-length sentences.\n3. FORMATTING CONSTRAINTS:\n- Return EXACTLY " + paragraphCount + " paragraphs.\n- Keep exactly one blank line between paragraphs.\n- Do not add fake facts, conclusions, or greetings.\n- Output ONLY the final plain text."
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const cleanText = cleanOutput(rawChoice);
    
    const finalResult = injectHumanPerplexity(cleanText);

    return Response.json({ result: finalResult });
  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json(
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}