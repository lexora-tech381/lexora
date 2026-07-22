import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12_000;

// Dynamic System Prompts based on selected Mode
const MODE_PROMPTS: Record<string, string> = {
  Standard: `Rewrite naturally. Mix short blunt statements with long fluid ideas. Use conversational transitions and organic phrasing.`,
  
  Friendly: `Rewrite as if chatting with a close friend. Use casual phrasing, contractions, relatable analogies, and a warm, informal rhythm.`,
  
  Academic: `Rewrite in clear, human student prose. Avoid mechanical transitions like 'Furthermore' or 'In summary'. Focus on direct argument flow and varied sentence structures.`,
  
  Professional: `Rewrite in direct workplace language. Sound like an expert writing a real email or report—clear, candid, and free of corporate fluff.`,
  
  Simple: `Rewrite using plain, clear language that anyone can follow while keeping all original details intact.`
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, mode } = body as { text?: string; mode?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "Please provide valid text to humanize." },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { error: `Text exceeds character limit of ${MAX_TEXT_LENGTH}.` },
        { status: 400 }
      );
    }

    const inputWordCount = countWords(trimmedText);
    const selectedMode = mode && MODE_PROMPTS[mode] ? mode : "Standard";
    const modeInstruction = MODE_PROMPTS[selectedMode];

    const systemInstruction = `You are an opinionated human writer editing a draft for a personal blog post or conversational piece.

STRICT INSTRUCTIONS TO ELIMINATE ALL AI TRACES:
1. **First-Person & Conversational Hooks:** Use "I", "me", "my", or "you" frequently. Start sentences with "And", "But", "Look", or "Honestly".
2. **Natural Delays & Backtracking:** Add 1-2 instances of mid-thought pivots (e.g., "Actually, scratch that—", "Wait, let me explain...", "Or at least, that's how it feels").
3. **Extreme Burstiness:** Mix a 3-word sentence fragment (e.g., "Not even close.") with a long, rambling sentence that spans three lines.
4. **Use Parentheses:** Add side thoughts or casual tangents inside parentheses (like this quick note right here).
5. **Strictly Ban Standard AI Vocabulary:** NEVER use "delve", "tapestry", "crucial", "testament", "pivotal", "in today's world", "moreover", "furthermore", "in conclusion", "vital", "beacon", "foster", "underscore", "basically", "simply".
6. **Mode Style:** ${modeInstruction}

RULES:
- Keep target length around ~${inputWordCount} words.
- Output ONLY the rewritten human text.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Rewrite this text to completely humanize it:\n\n${trimmedText}` }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.95, // High entropy breaks predictable token sequences
        topP: 0.95,
      },
    });

    const resultText = response.text?.trim();

    if (!resultText) {
      return Response.json(
        { error: "Failed to generate humanized text. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ result: resultText });

  } catch (error: any) {
    console.error("========== GEMINI ERROR ==========");
    console.error(error);

    return Response.json(
      {
        error: error?.message || "Unknown Gemini error",
        status: error?.status,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}