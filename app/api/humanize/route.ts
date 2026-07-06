import Together from "together-ai";

// Obfuscates common vowel characters to shatter the text pattern matching used by ZeroGPT
function bypassParser(text: string): string {
  return text
    .replace(/e/g, "е")  // Swaps normal English 'e' with Cyrillic 'е'
    .replace(/o/g, "о")  // Swaps normal English 'o' with Cyrillic 'о'
    .replace(/a/g, "а"); // Swaps normal English 'a' with Cyrillic 'а'
}

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
      // CRITICAL CONFIG CHANGES FOR ZERO-GPT BYPASS:
      temperature: 0.95,      // Higher temp forces less predictable word sequences
      top_p: 0.75,          // Restricting top_p forces the model out of standard AI syntax loops
      presence_penalty: 0.8, // Heavily penalizes repetitive token patterns
      max_tokens: Math.ceil(originalWords * 2),
      stop: ["I see you", "Here is another version", "Here is the rewritten text"],
      messages: [
        {
          role: "system",
          content: `You are an elite linguistic specialist. Completely restructure the text to mimic chaotic, organic human writing.

Strict Behavioral Directives:
1. MAXIMIZE BURSTINESS: Drastically vary sentence lengths. Construct some sentences as ultra-short, blunt assertions (3-5 words). Follow them with long, complex sentences containing embedded clauses and em-dashes (—).
2. OBFUSCATE PERPLEXITY: Do not choose the standard, expected next word. Completely avoid common AI words: "delve", "testament", "tapestry", "moreover", "furthermore", "meticulously", "in conclusion".
3. NO LOGICAL BOILERPLATE: Erase formal organizational transitions like "Firstly", "Secondly", "Additionally", or "In conclusion". Use natural narrative bridges instead.
4. TEXT CONSTRAINTS: Return EXACTLY ${paragraphCount} paragraphs. Keep one blank line between them. Do not change facts or add conclusions. Output only the humanized prose.`
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const polishedText = cleanOutput(rawChoice);
    
    // RUN OBFUSCATION UTILITY: This shatters ZeroGPT scoring patterns
    const finalResult = bypassParser(polishedText);

    return Response.json({ result: finalResult });
  } catch (error: any) {
    console.error("TOGETHER API ERROR:", error);

    return Response.json(
      { error: error?.message || "Unable to process text at this time." },
      { status: 500 }
    );
  }
}