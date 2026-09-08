import { buildOrderedChunks, joinChunksInOrder } from "@/lib/humanize/chunk";
import { generateGeminiText } from "@/lib/humanize/gemini";
import {
  buildRepairPrompt,
  buildRewritePrompt,
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
  if (validation.isValid) {
    return {
      result: rewrite,
      usedFallback: false,
      repaired: false,
    };
  }

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

  const repairValidation = validatePreservation(chunkText, repairedText, items);
  if (repairValidation.isValid) {
    return {
      result: repairedText,
      usedFallback: false,
      repaired: true,
    };
  }

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
