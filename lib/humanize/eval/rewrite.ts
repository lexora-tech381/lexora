import type {
  NaturalnessDiagnostic,
  NamedCheck,
  RewriteAnalysis,
} from "@/lib/humanize/eval/types";

function normalizeForSimilarity(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.%$€£¥/-]/g, "")
    .trim();
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+(?:['.-][a-z0-9]+)*/g) ?? [];
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Normalized Levenshtein similarity in [0, 1]. 1 = identical. */
export function normalizedLevenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Prefer the shorter string as columns for a smaller DP footprint.
  const rows = a.length;
  const cols = b.length;
  let previous = new Array<number>(cols + 1);
  let current = new Array<number>(cols + 1);

  for (let j = 0; j <= cols; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= rows; i += 1) {
    current[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= cols; j += 1) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    const swap = previous;
    previous = current;
    current = swap;
  }

  const distance = previous[cols];
  return 1 - distance / Math.max(rows, cols);
}

function multisetIntersectionSize(a: string[], b: string[]): number {
  const counts = new Map<string, number>();
  for (const token of a) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  let shared = 0;
  for (const token of b) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) {
      shared += 1;
      counts.set(token, remaining - 1);
    }
  }
  return shared;
}

/**
 * Deterministic rewrite/change metrics.
 * Lower similarity is NOT automatically better — meaningful rewrite + preservation both matter.
 */
export function analyzeRewriteChange(
  input: string,
  output: string,
): RewriteAnalysis {
  const exactMatch = input === output;
  const normalizedInput = normalizeForSimilarity(input);
  const normalizedOutput = normalizeForSimilarity(output);
  const exactNormalizedMatch = normalizedInput === normalizedOutput;

  const characterSimilarity = normalizedLevenshteinSimilarity(
    normalizedInput,
    normalizedOutput,
  );

  const inputWords = tokenizeWords(input);
  const outputWords = tokenizeWords(output);
  const sharedWords = multisetIntersectionSize(inputWords, outputWords);
  const maxWords = Math.max(inputWords.length, outputWords.length, 1);
  const wordOverlapRatio = sharedWords / maxWords;

  // Percentage of input words that were changed/replaced (not preserved in output).
  // Bounded to [0, 100]. sharedWords counts multiset overlap with the input bag.
  const inputWordCount = inputWords.length;
  const outputWordCount = outputWords.length;
  const changedWordCount =
    inputWordCount === 0 ? 0 : inputWordCount - sharedWords;
  const changedWordPercentage =
    inputWordCount === 0 ? 0 : (changedWordCount / inputWordCount) * 100;

  const inputSentences = splitSentences(input);
  const outputSentences = splitSentences(output);
  const inputSentenceSet = new Set(
    inputSentences.map((sentence) => normalizeForSimilarity(sentence)),
  );
  const outputSentenceSet = new Set(
    outputSentences.map((sentence) => normalizeForSimilarity(sentence)),
  );

  let unchangedSentences = 0;
  for (const sentence of inputSentenceSet) {
    if (outputSentenceSet.has(sentence)) {
      unchangedSentences += 1;
    }
  }
  const changedSentenceCount =
    inputSentenceSet.size + outputSentenceSet.size - 2 * unchangedSentences;

  const lengthRatio =
    inputWordCount === 0 ? 1 : outputWordCount / inputWordCount;

  return {
    exactMatch,
    exactNormalizedMatch,
    characterSimilarity,
    wordOverlapRatio,
    wordOverlapPercentage: wordOverlapRatio * 100,
    changedWordCount,
    changedWordPercentage,
    inputSentenceCount: inputSentences.length,
    outputSentenceCount: outputSentences.length,
    changedSentenceCount,
    lengthRatio,
  };
}

const NATURALNESS_DIAGNOSTIC_CHECK_NAMES = new Set([
  "formulaic_transitions",
  "formulaic_transition_reduction",
  "excessive_repetition",
  "repeated_opener_control",
  "unnecessary_filler",
  "broken_sentences",
  "grammar_degradation",
  "obvious_meaning_loss",
]);

/**
 * Diagnostic only: fraction of naturalness-related checks that pass.
 * Not a human-writing score and must not be treated as one.
 */
export function buildNaturalnessDiagnostic(
  qualityChecks: NamedCheck[],
  naturalnessChecks: NamedCheck[],
): NaturalnessDiagnostic {
  const relevant = [...qualityChecks, ...naturalnessChecks].filter((check) =>
    NATURALNESS_DIAGNOSTIC_CHECK_NAMES.has(check.name),
  );
  const applicable = relevant.filter((check) => check.status !== "n/a");
  const passCount = applicable.filter((check) => check.status === "pass").length;
  const failCount = applicable.filter((check) => check.status === "fail").length;

  return {
    label: "naturalness_diagnostic_check_pass_rate",
    note: "Fraction of naturalness-related diagnostic checks that passed. Not a human-writing score.",
    checksConsidered: applicable.map((check) => check.name),
    passCount,
    failCount,
    score: applicable.length === 0 ? 1 : passCount / applicable.length,
  };
}
