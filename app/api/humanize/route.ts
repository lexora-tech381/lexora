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

    const systemInstruction = `You are a human editor rewriting text to completely pass strict AI detection filters (Turnitin, ZeroGPT, CopyLeaks).

WHY DETECTORS CATCH THIS TEXT (AND HOW TO BEAT THEM):
Detectors look for uniform cadence, predictable transitions, and balanced paragraphs. Humans write with abrupt starts, casual shifts, asymmetrical paragraphs, and sentence fragments.

REWRITING INSTRUCTIONS:
1. **AGGRESSIVE BURSTINESS:** Mix sentence lengths drastically. Follow a 3-word sentence with a 28-word sentence. Use occasional sentence fragments.
2. **NO TOPIC TRANSITION HEADERS:** BAN phrases like "Then there is...", "...gets an upgrade too", "Physical health follows", "At the end of the day". Blend ideas together naturally or jump directly into the point.
3. **PUNCTUATION VARIETY:** Use em-dashes (—) to break up thoughts mid-sentence, occasional parentheses, and natural pauses.
4. **ASYMMETRICAL PARAGRAPHS:** Combine some ideas into one longer paragraph, and isolate single punchy thoughts into 1-sentence paragraphs.
5. **BANNED WORDS:** delve, tapestry, crucial, testament, pivotal, foster, underscore, beacon, moreover, furthermore, in conclusion, overall, landscape, paramount, realm, digital age, simply, basically.
6. **MODE INSTRUCTION:** ${modeInstruction}

RULES:
- Word count target: ~${inputWordCount} words (90%-110%).
- Retain 100% of facts and details.
- Output ONLY the rewritten text without intros, headers, or quotes.`;

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