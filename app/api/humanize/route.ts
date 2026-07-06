import Together from "together-ai"; // FIXED: Corrected npm package import string

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
    // FIXED: The client will automatically discover process.env.TOGETHER_API_KEY
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
      const currentTemperature = 1.1 + (attempts * 0.05); 
      const currentTopP = 0.85;

      const response = await together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", 
        temperature: currentTemperature,
        top_p: currentTopP,
        repetition_penalty: 1.25, 
        messages: [
          {
            role: "system",
            content: `
            You are a writing editor specializing in highly erratic, organic prose rhythms.
            Rewrite the user text to maximize structural randomness.
            
            Rules:
           - Preserve the same number of paragraphs as the original text.
- Keep headings if the original has headings.
- Do not merge paragraphs together.
- Keep the final word count between 90% and 110% of the original word count.
- Use a natural student/professional tone, not slang or overly casual wording.
- Do not use phrases like “you know,” “whatever,” “stuff like that,” or “yeah.”
            `
          },
          
          {
            role: "user",
            content: `
          Original word count: ${text.trim().split(/\s+/).length}
          Original paragraph count: ${text.trim().split(/\n\s*\n/).length}
          
          Rewrite the text while preserving the same paragraph structure and similar length:
          
          ${text}
          `,
          }

        ]
      });

      // FIXED: Resolved the index mapping array typo
      const rawChoice = response.choices?.[0]?.message?.content || "";
      
      finalResult = optimizePacingAndSyntax(rawChoice);

      const finalWords = finalResult.split(/\s+/).length;
      if (finalWords > 0) {
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
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}