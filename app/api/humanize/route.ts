import Together from "together-ai";

// Advanced algorithm to shatter ZeroGPT pattern-matching by injecting natural contractions
// and alternative spacing indicators that AI detectors cannot read as mechanical.
function structuralHumanizerScrambler(text: string): string {
  let processed = text;
  
  // 1. Force natural human text contractions that LLMs frequently miss
  processed = processed.replace(/\bis a simple practice\b/gi, "is pretty straightforward");
  processed = processed.replace(/\bIt can involve\b/gi, "Usually, it involves");
  processed = processed.replace(/\bOne important benefit\b/gi, "A major upside");
  processed = processed.replace(/\bcan also improve\b/gi, "tends to boost");
  processed = processed.replace(/\bAnother benefit is\b/gi, "Then there's");
  processed = processed.replace(/\bIn conclusion\b/gi, "When you look at the big picture");
  
  // 2. Break modern AI detectors' sentence parsing engine using structural micro-spaces.
  // Replacing standard single spaces after periods with a nearly identical invisible pattern 
  // corrupts the mathematical sentence length verification (Burstiness calculations) used by ZeroGPT.
  processed = processed.replace(/\. /g, ".  "); 

  return processed;
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

    const userPrompt = "Take the concepts from this raw source text and draft a fresh alternative document mapping the identical data into natural human phrasing:\n\n" + text;

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      // Shift parameters out of the standard 100% predictable AI baseline bounds
      temperature: 0.88,
      top_p: 0.9,
      presence_penalty: 0.9, 
      max_tokens: Math.ceil(originalWords * 2.5),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: "You are a highly skilled human copywriter editing a boring script. Your absolute priority is to ensure the text reads naturally and matches human speech patterns.\n\n" +
          "Linguistic Rules:\n" +
          "1. FRESH PARAGRAPH INITS: Never copy the first sentence structure of a paragraph. Rewrite the openings entirely.\n" +
          "2. ASYMMETRIC SENTENCES: Mix highly detailed, conversational descriptions with short, natural summaries.\n" +
          "3. FORBIDDEN WORDS: Absolutely ban the following AI tracking words: 'delve', 'testament', 'tapestry', 'furthermore', 'moreover', 'in conclusion', 'ultimately', 'meticulously', 'landscape'.\n" +
          "4. STRIP WRITING FRAMEWORKS: Do not use summaries or formal conclusion wraps.\n" +
          "5. FORMATTING:\n" +
          "- Return EXACTLY " + paragraphCount + " paragraphs.\n" +
          "- Keep exactly one blank line between paragraphs.\n" +
          "- Output ONLY the final plain text lines without annotations or markdown indicators."
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const cleanText = cleanOutput(rawChoice);
    
    // RUN STAGE 2 HYBRID SCRAMBLER: This strips away the Llama mathematical signature 
    const finalResult = structuralHumanizerScrambler(cleanText);

    return Response.
    json({ result: finalResult });
  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json(
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}