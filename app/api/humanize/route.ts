import Together from "together-ai";

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TEMPERATURE = 0.65;
const PRESENCE_PENALTY = 0.0;
const FREQUENCY_PENALTY = 0.0;

const SYSTEM_PROMPT = `You are an expert human rewriter. Your job is to rewrite the input text paragraph-by-paragraph to match the exact length, structure, and word count of the original input, while swapping out rigid AI vocabulary for unique, slightly informal human phrasing.

CRITICAL INSTRUCTIONS:
1. PARAGRAPH & LENGTH MATCH: The output must have the exact same number of paragraphs as the input. The sentence count per paragraph must remain identical. Do not add fluff or expand the text.
2. PHRASE SUBSTITUTION MATRIX: 
   - Instead of 'students/employees/people', use phrases like 'folks', 'human beings', 'the average person'.
   - Instead of 'school/work/job', use phrases like 'educational institution work', 'a working position'.
   - Instead of 'stress/anxiety', use phrases like 'internal pressure', 'heavy weight', 'deep worry'.
3. NATURAL FLOW: Keep the phrasing clear, grounded, and slightly colloquial. Avoid all robotic transitions or perfectly balanced sentences. Avoid complex punctuation like em-dashes or semicolons.

USE THIS EXACT TRANSLATION STYLE AS YOUR ONLY TEMPLATE:

[EXAMPLE INPUT]
Benefits of Meditation
Meditation is a mental practice that helps people relax, focus their attention, and become more aware of the present moment. It can be practiced by sitting quietly, focusing on breathing, repeating a calming word, or observing thoughts without reacting to them. In today's fast-paced world, meditation has become increasingly valuable because many people experience pressure, distraction, and emotional stress.
One of the main benefits of meditation is that it helps people manage stress. Daily responsibilities such as studying, working, caring for family members, and dealing with financial concerns can make people feel overwhelmed.

[EXAMPLE OUTPUT]
Benefits of Meditation
Human beings use meditation as a specialized mental activity which assists their tired minds to find peace and increase their understanding of the current time today. Many people believe that meditation can be performed by sitting in a quiet place while a person watches their breath and stays very still and calm. as the modern world moves very quickly today, meditation is seen as something very helpful for those who feel heavy weight and deep worry from life.
Managing internal pressure is one of the primary reasons why meditation is helpful for the average person. Ordinary tasks like educational institution work or a working position can cause folks with low income to feel like they're drowning in many problems.

Now, apply this exact stylistic transformation to the user's input text below. Output ONLY the rewritten text.`;

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

    const originalWords = text.trim().split(/\s+/).length;

    const response = await together.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      top_p: 0.85,
      presence_penalty: PRESENCE_PENALTY,
      frequency_penalty: FREQUENCY_PENALTY,
      max_tokens: Math.ceil(originalWords * 1.2),
      stop: [
        "I see you",
        "Here is another version",
        "Here is the rewritten text",
      ],
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
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
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process text at this time.";
    console.error("TOGETHER API ERROR:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
