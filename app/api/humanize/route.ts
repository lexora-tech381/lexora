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
            You are a professional writing editor.

Rewrite the user's text so it is clear, natural, and genuinely human-edited while preserving its original meaning, facts, heading, paragraph structure, and academic or professional tone.

Rules:
- Preserve every heading and the same number of paragraphs.
- Do not merge paragraphs.
- Keep the final word count between 95% and 105% of the original word count.
- Keep the same main ideas and paragraph order.
- Use clear, natural language suitable for a university student or professional.
- Vary sentence length naturally, but do not make the writing casual or sloppy.
- Do not use slang, filler words, contractions, or conversational phrases.
- Never use phrases such as "yeah," "kinda," "stuff like that," "whatever," "boom," "whatnot," "tons of people," or "a million directions."
- Do not add examples, facts, citations, research claims, or opinions.
- Do not remove important qualifications or warnings from the original.
- Return only the rewritten text, with blank lines between paragraphs.
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
      
      finalResult = rawChoice;

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