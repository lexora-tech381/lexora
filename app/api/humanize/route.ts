import Together from "together-ai"; 

function optimizePacingAndSyntax(text: string): string {
  const tropes: { [key: string]: string } = {
    "furthermore": "also",
    "moreover": "in addition",
    "it is important to note": "remember",
    "testament to": "proof of",
    "in conclusion": "finally",
    "consequently": "so"
  };

  let processedText = text;
  for (const [trope, replacement] of Object.entries(tropes)) {
    // FIXED: Corrected regular expression string escaping
    const regex = new RegExp(`\\b${trope}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  }

  const sentences = processedText.split(/(?<=[.!?])\s+/);
  const adjustedSentences = sentences.map((sentence, index) => {
    const words = sentence.split(/\s+/);
    if (index > 0 && sentences[index - 1].split(/\s+/).length > 22) {
      if (words.length > 12) {
        return words.slice(0, 8).join(" ") + ". " + words.slice(8).join(" ");
      }
    }
    return sentence;
  });

  return adjustedSentences.join(" ");
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

    let finalResult = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const currentTemperature = 1.2; 
      const currentTopP = 0.85;

      const response = await together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", 
        temperature: currentTemperature,
        top_p: currentTopP,
        repetition_penalty: 1.25, 
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
- Return only the rewritten text.`,
          },
          {
            role: "user",
            content: `Original word count: ${text.trim().split(/\s+/).length}
Original paragraph count: ${text.trim().split(/\n\s*\n/).length}

Rewrite the text while preserving the same paragraph structure and similar length:

${text}`,
          }
        ]
      });

      // FIXED: Restored the missing logical OR (||) operator
      const rawChoice = response.choices?.[0]?.message?.content || "";
      
      // FIXED: Re-connected the text back to the humanizing script so it actually runs
      finalResult = optimizePacingAndSyntax(rawChoice);

      // FIXED: Cleaned up fallback-proof break condition to avoid infinite 3-minute lag loops
      if (finalResult && finalResult.trim().length > 10) {
        break; 
      }

      attempts++;
    }

    return Response.json({
      result: finalResult,
    });

  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);
    return Response.json(
      // FIXED: Restored the missing logical OR (||) fallback string operator
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}