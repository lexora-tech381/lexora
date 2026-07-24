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

    const prompt = `
Rewrite the following text to improve readability, clarity, grammar, and overall flow.

Requirements:
- Preserve the original meaning.
- Do not invent facts.
- Keep approximately the same length.
- Use a ${tone} tone.
- Return only the rewritten text.

Text:

${text}
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
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