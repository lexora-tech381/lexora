import { buildOrderedChunks, joinChunksInOrder } from "@/lib/humanize/chunk";
import { generateGeminiText } from "@/lib/humanize/gemini";
import {
  buildRepairPrompt,
  buildRewritePrompt,
  buildWeakRewritePrompt,
  resolveHumanizeStyle,
} from "@/lib/humanize/prompt";
import {
  extractPreservationItems,
  listCriticalPreservationItems,
  validatePreservation,
  type ValidationResult,
} from "@/lib/humanize/preserve";

export type HumanizePipelineResult = {
  result: string;
  usedFallback: boolean;
  repaired: boolean;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.%$€£¥/-]/g, "")
    .trim();
}

function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:['.-][a-z0-9]+)*/g) ?? [];
}

function wordOverlapRatio(input: string, output: string): number {
  const inputWords = tokenizeWords(input);
  const outputWords = tokenizeWords(output);
  if (inputWords.length === 0 && outputWords.length === 0) return 1;
  if (inputWords.length === 0 || outputWords.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const token of inputWords) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  let shared = 0;
  for (const token of outputWords) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) {
      shared += 1;
      counts.set(token, remaining - 1);
    }
  }

  return shared / Math.max(inputWords.length, outputWords.length);
}

/** Substantial prose that should be meaningfully rewritten (not a short label/title). */
export function hasSubstantialProse(text: string): boolean {
  const words = countWords(text);
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return words >= 40 && sentences.length >= 2;
}

/**
 * Diagnostic signal only: near-identical output on substantial prose is a weak rewrite.
 * Similarity alone never rejects a valid preserved rewrite after a retry.
 */
export function isWeakRewrite(original: string, rewritten: string): boolean {
  if (!hasSubstantialProse(original)) return false;

  const normalizedOriginal = normalizeForComparison(original);
  const normalizedRewritten = normalizeForComparison(rewritten);
  if (!normalizedRewritten) return true;
  if (normalizedOriginal === normalizedRewritten) return true;

  return wordOverlapRatio(original, rewritten) >= 0.97;
}

async function rewriteOnce(prompt: string): Promise<string> {
  return generateGeminiText(prompt);
}

async function humanizeChunk(
  chunkText: string,
  stylePersona: string,
): Promise<HumanizePipelineResult> {
  const items = extractPreservationItems(chunkText);
  const criticalItems = listCriticalPreservationItems(items);
  const rewritePrompt = buildRewritePrompt(
    stylePersona,
    chunkText,
    criticalItems,
  );

  let rewrite = "";
  try {
    rewrite = await rewriteOnce(rewritePrompt);
  } catch (error) {
    console.error("Gemini rewrite failed for chunk:", error);
    return {
      result: chunkText,
      usedFallback: true,
      repaired: false,
    };
  }

  let validation = validatePreservation(chunkText, rewrite, items);
  let repaired = false;

  if (!validation.isValid) {
    let repairedText = "";
    try {
      repairedText = await rewriteOnce(
        buildRepairPrompt({
          stylePersona,
          sourceText: chunkText,
          failedRewrite: rewrite,
          missingItems: validation.missingItems,
          issueDetails: validation.issues.map((issue) => issue.detail),
        }),
      );
    } catch (error) {
      console.error("Gemini repair failed for chunk:", error);
      return {
        result: chunkText,
        usedFallback: true,
        repaired: false,
      };
    }

    const repairValidation = validatePreservation(
      chunkText,
      repairedText,
      items,
    );
    if (!repairValidation.isValid) {
      console.error("Humanize preservation failed after repair:", {
        issues: repairValidation.issues.map((issue) => issue.code),
        missingCount: repairValidation.missingItems.length,
      });
      return {
        result: chunkText,
        usedFallback: true,
        repaired: true,
      };
    }

    rewrite = repairedText;
    validation = repairValidation;
    repaired = true;
  }

  // If the rewrite passed preservation but barely changed substantial prose,
  // make one stronger rewrite attempt. Do not reject solely for similarity.
  if (isWeakRewrite(chunkText, rewrite)) {
    let strongerRewrite = "";
    try {
      strongerRewrite = await rewriteOnce(
        buildWeakRewritePrompt({
          stylePersona,
          sourceText: chunkText,
          weakRewrite: rewrite,
          preservationItems: criticalItems,
        }),
      );
    } catch (error) {
      console.error("Gemini weak-rewrite retry failed for chunk:", error);
      return {
        result: rewrite,
        usedFallback: false,
        repaired,
      };
    }

    const strongerValidation = validatePreservation(
      chunkText,
      strongerRewrite,
      items,
    );
    if (strongerValidation.isValid) {
      return {
        result: strongerRewrite,
        usedFallback: false,
        repaired: true,
      };
    }

    // Keep the earlier valid rewrite rather than falling back or accepting bad preservation.
    console.error("Weak-rewrite retry failed preservation; keeping prior valid rewrite.", {
      issues: strongerValidation.issues.map((issue) => issue.code),
    });
  }

  return {
    result: rewrite,
    usedFallback: false,
    repaired,
  };
}

function validateCombinedResult(
  originalText: string,
  rewrittenText: string,
): ValidationResult {
  return validatePreservation(originalText, rewrittenText);
}

export async function runHumanizePipeline(params: {
  text: string;
  styleKey: unknown;
}): Promise<HumanizePipelineResult> {
  const sourceText = params.text.trim();
  const stylePersona = resolveHumanizeStyle(params.styleKey);
  const chunks = buildOrderedChunks(sourceText);

  if (chunks.length === 0) {
    return {
      result: sourceText,
      usedFallback: true,
      repaired: false,
    };
  }

  const chunkResults: HumanizePipelineResult[] = [];
  for (const chunk of chunks) {
    chunkResults.push(await humanizeChunk(chunk, stylePersona));
  }

  const combined = joinChunksInOrder(
    chunkResults.map((chunkResult) => chunkResult.result),
  );

  const combinedValidation = validateCombinedResult(sourceText, combined);
  if (combinedValidation.isValid) {
    return {
      result: combined,
      usedFallback: chunkResults.some((chunkResult) => chunkResult.usedFallback),
      repaired: chunkResults.some((chunkResult) => chunkResult.repaired),
    };
  }

  // Final safety: never return a combined result that lost critical items.
  console.error("Combined humanize output failed validation; using original.", {
    issues: combinedValidation.issues.map((issue) => issue.code),
  });

  return {
    result: sourceText,
    usedFallback: true,
    repaired: chunkResults.some((chunkResult) => chunkResult.repaired),
  };
}
