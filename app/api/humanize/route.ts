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

    const systemInstruction = `You are a human writer rewriting text to pass strict AI detection algorithms (Turnitin, ZeroGPT, CopyLeaks).

WHY AI DETECTORS TRIGGER (AND HOW YOU WILL BEAT THEM):
Detectors check for predictable word choices (perplexity) and uniform sentence structures (burstiness). Standard AI always uses smooth, balanced, uniform sentences and formal connective phrases. Humans do NOT write like that.

REWRITING LAWS:
1. **EXTREME SENTENCE CONTRAST:** Follow a tiny 2-to-5 word sentence with a complex 25-word sentence. Break up predictable cadence continuously.
2. **USE HUMAN STRUCTURAL MARKS:** Throw in em-dashes (—), occasional parentheses, and natural pauses. 
3. **NO PARALLEL THREE-ITEM LISTS:** Never write "x, y, and z" repeatedly.
4. **BANNED WORDS (DO NOT USE):** delve, tapestry, crucial, testament, pivotal, foster, underscore, beacon, moreover, furthermore, in conclusion, overall, landscape, paramount, realm, digital age.
5. **MODE OVERRIDE:** ${modeInstruction}

EXAMPLE OF THE TARGET TRANSFORMATION:
AI Version: "Meditation is a beneficial habit that reduces stress, enhances focus, and improves sleep quality in daily life."
Human Version: "Stress wrecks everything—your sleep, focus, energy. Practicing meditation every evening actually gives your brain a chance to reset. It doesn't take hours either; even five minutes makes a real difference."

RULES:
- Word count target: ~${inputWordCount} words (90%-110%).
- Keep 100% of facts and meaning.
- Output ONLY the rewritten text without intros, explanations, or quotes.`;

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