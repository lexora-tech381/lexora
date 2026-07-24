import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 12000;

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Please enter some text." },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "Text is too long." },
        { status: 400 }
      );
    }

    const tone =
      mode === "Academic"
        ? "academic"
        : mode === "Professional"
        ? "professional"
        : mode === "Friendly"
        ? "friendly"
        : mode === "Simple"
        ? "simple"
        : "natural";

    const prompt = `You are an expert editor.

You are an expert professional editor.

Your task is to rewrite the user's text so it reads as if it were naturally written by a skilled human author.

Requirements:

- Preserve every fact, idea, and important detail.
- Never invent new information, examples, or claims.
- Rewrite the wording instead of making simple synonym replacements.
- Improve sentence flow, clarity, and readability.
- Vary sentence length naturally.
- Use natural transitions between ideas.
- Avoid repetitive words and repetitive sentence openings.
- Preserve the author's original tone unless another tone is requested.
- Do not make the writing sound overly academic, poetic, or dramatic.
- Keep the writing authentic and conversational while remaining professional.
- Rewrite headings naturally only when it genuinely improves them.
- Keep approximately the same overall length (±10%).
- Return only the rewritten text without explanations.
Text:

${text}`;

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            temperature: 0.9,
            topP: 0.9,
          },
        });

    const result = response.text;

    if (!result) {
      throw new Error("Empty response from Gemini.");
    }

    return NextResponse.json({
      result: result.trim(),
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message || "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}