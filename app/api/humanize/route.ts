import Together from "together-ai"; // FIXED: Corrected npm package import string

function optimizePacingAndSyntax(text: string): string {
  // 1. Clean out generic AI transitions
  const tropes: { [key: string]: string } = {
    "furthermore": "also",
    "moreover": "in addition",
    "it is important to note": "remember",
    "testament to": "proof of",
    "in conclusion": "finally",
    "consequently": "so",
    "not only": "not just",
    "additionally": "plus"
  };

  let processedText = text;
  for (const [trope, replacement] of Object.entries(tropes)) {
    const regex = new RegExp(`\\b${trope}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  }

  // 2. Safely parse and alternate sentence rhythms
  const sentences = processedText.split(/(?<=[.!?])\s+/);
  const adjustedSentences = sentences.map((sentence, index) => {
    if (!sentence.trim()) return sentence;
    
    let words = sentence.trim().split(/\s+/);
    if (words.length === 0 || words[0] === "") return sentence;

    // ENFORCE BURSTINESS: Safely split long sentences without duplicating words
    if (index > 0 && sentences[index - 1].split(/\s+/).length > 20) {
      if (words.length > 12) {
        return words.slice(0, 6).join(" ") + ". " + words.slice(6).join(" ");
      }
    }

    // GRAMMAR BENDING: Inject casual human speech hooks securely
    if (index % 3 === 0 && words.length > 5) {
      const casualStarters = ["But ", "And ", "So, ", "Honestly, "];
      const randomStarter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
      
      // Fix the first word casing safely before adding the starter string
      let firstWord = words[0];
      words[0] = firstWord.charAt(0).toLowerCase() + firstWord.slice(1);
      
      return randomStarter + words.join(" ");
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