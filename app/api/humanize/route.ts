import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.75;
const TOP_P = 0.7;
const PRESENCE_PENALTY = 0.3;
const FREQUENCY_PENALTY = 0.3;
const MAX_TOKENS = 1200;

function breakDetectorMath(text: string): string {
  let lines = text.split("\n");
  let processedLines = lines.map((line) => {
    if (!line.trim() || line.startsWith("#")) return line;

    // Programmatically lowercase about 15% of sentences after a period to break AI math
    let sentences = line.split(/(?<=[.!?])\s+/);
    let modifiedSentences = sentences.map((sentence, index) => {
      if (index > 0 && Math.random() < 0.15 && sentence.length > 0) {
        return sentence.charAt(0).toLowerCase() + sentence.slice(1);
      }
      return sentence;
    });

    let joined = modifiedSentences.join(" ");
    return joined.replace(/, /g, ",  ").replace(/\. /g, ". ");
  });

  return processedLines.join("\n");
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
        { status: 400 },
      );
    }

    // 1. DYNAMIC WORD COUNT CALCULATION
    const inputWordCount = text.trim().split(/\s+/).length;

    // 2. INJECT COUNT INTO THE SYSTEM PROMPT TO LOCK LENGTH
    const systemPrompt = `You are a professional human essayist. Rewrite the input text to sound highly natural and engaging. 

CRITICAL LAWS:
1. WORD COUNT LOCK: Your final output MUST be between ${inputWordCount - 15} and ${inputWordCount + 15} words max. Budget your words perfectly across the text. Do not add fluff.
2. FULL STRUCTURE: You must write a complete essay with a clean introduction, detailed body paragraphs, and a comprehensive closing conclusion paragraph.
3. PROFESSIONAL STYLE: Do not use cheap slang or intentional typos. Use proper capitalization and grammar.
4. PHRASE SUBSTITUTION: 
   - Instead of 'students/employees/people', use 'folks' or 'human beings'.
   - Instead of 'school/work/job', use 'educational institution work' or 'a working position'.
   - Instead of 'stress/anxiety', use 'internal pressure' or 'heavy weight'.
5. STRICT BAN: Never use the transition phrase 'In conclusion' or 'Another benefit'.

Output ONLY the beautifully written, full essay text.`;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      top_p: TOP_P,
      presence_penalty: PRESENCE_PENALTY,
      frequency_penalty: FREQUENCY_PENALTY,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content || "";
    const cleanText = cleanOutput(rawChoice);

    // 3. APPLY STYLISTIC FILTER RIGHT BEFORE OUTPUT
    const finalResult = breakDetectorMath(cleanText);

    return Response.json({ result: finalResult });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to process text.";
    console.error("TOGETHER API ERROR:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
