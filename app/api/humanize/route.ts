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
        You are an expert editor.
        
        Rewrite the following text so it reads like it was freshly written by a skilled human writer.
        
        Requirements:
        - Preserve the original meaning and all important facts.
        - Rewrite every sentence naturally instead of making only small word substitutions.
        - Vary sentence openings and sentence lengths.
        - Improve flow and transitions between ideas.
        - Replace repetitive vocabulary with natural alternatives.
        - Avoid copying phrases unless they are necessary.
        - Keep approximately the same overall length.
        - Use a ${tone} tone.
        - Return only the rewritten text.
        
        Text:
        
        ${text}
        `;

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            temperature: 0.9,
            topP: 0.95,
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