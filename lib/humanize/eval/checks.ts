import {
  extractPreservationItems,
  validatePreservation,
} from "@/lib/humanize/preserve";
import { findMissingTechnicalTerms } from "@/lib/humanize/eval/terms";
import type { NamedCheck } from "@/lib/humanize/eval/types";

const FORMULAIC_TRANSITIONS = [
  "furthermore",
  "moreover",
  "additionally",
  "in conclusion",
  "in summary",
  "as a result",
  "in addition",
  "it is important to note",
  "in today's",
  "overall,",
] as const;

const FILLER_PHRASES = [
  "you know",
  "basically",
  "kind of",
  "sort of",
  "from a tactical execution angle",
  "at the end of the day",
] as const;

const GRAMMAR_DEGRADATION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "agreement_error_help",
    pattern: /\b(it|this|that|process|system|model)\s+help\b/gi,
  },
  {
    name: "agreement_error_happen",
    pattern: /\b(it|this|that|process)\s+happen\b/gi,
  },
  {
    name: "have_for_has",
    pattern: /\b(it|this|that|he|she)\s+have\b/gi,
  },
  {
    name: "study_about",
    pattern: /\bstudy about\b/gi,
  },
];

function countOccurrences(text: string, phrase: string): number {
  const lower = text.toLowerCase();
  const target = phrase.toLowerCase();
  let count = 0;
  let index = 0;
  while (true) {
    const found = lower.indexOf(target, index);
    if (found === -1) break;
    count += 1;
    index = found + target.length;
  }
  return count;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceOpeners(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.map((sentence) => {
    const words = sentence.toLowerCase().match(/[a-z']+/g) ?? [];
    return words.slice(0, 2).join(" ");
  });
}

function repeatedOpenerCount(text: string): number {
  const openers = sentenceOpeners(text).filter(Boolean);
  const counts = new Map<string, number>();
  for (const opener of openers) {
    counts.set(opener, (counts.get(opener) ?? 0) + 1);
  }
  let repeated = 0;
  for (const value of counts.values()) {
    if (value >= 3) repeated += value;
  }
  return repeated;
}

function totalFormulaicCount(text: string): number {
  return FORMULAIC_TRANSITIONS.reduce(
    (sum, phrase) => sum + countOccurrences(text, phrase),
    0,
  );
}

function totalFillerCount(text: string): number {
  return FILLER_PHRASES.reduce(
    (sum, phrase) => sum + countOccurrences(text, phrase),
    0,
  );
}

function makeCheck(
  name: string,
  passed: boolean,
  detail?: string,
  isApplicable = true,
): NamedCheck {
  if (!isApplicable) {
    return { name, status: "n/a", detail };
  }
  return {
    name,
    status: passed ? "pass" : "fail",
    detail,
  };
}

export function buildPreservationChecks(
  input: string,
  output: string,
): NamedCheck[] {
  const items = extractPreservationItems(input);
  const validation = validatePreservation(input, output, items);
  const issueCodes = new Set(validation.issues.map((issue) => issue.code));

  const numberExpected =
    items.numbers.length + items.percentages.length + items.currencyValues.length;
  const citationExpected = items.citations.length > 0;
  const headingExpected = items.headings.length > 0;

  const missingNumbers = validation.issues
    .filter((issue) =>
      ["missing_number", "missing_percentage", "missing_currency"].includes(
        issue.code,
      ),
    )
    .map((issue) => issue.detail);

  const missingCitations = validation.issues
    .filter((issue) => issue.code === "missing_citation")
    .map((issue) => issue.detail);

  const missingHeadings = validation.issues
    .filter((issue) => issue.code === "missing_heading")
    .map((issue) => issue.detail);

  const missingTerms = findMissingTechnicalTerms(input, output);
  const termFail = missingTerms.length >= 4;

  const inputWords = countWords(input);
  const outputWords = countWords(output);
  const lengthRatio = inputWords === 0 ? 1 : outputWords / inputWords;

  return [
    makeCheck(
      "numbers",
      !issueCodes.has("missing_number") &&
        !issueCodes.has("missing_percentage") &&
        !issueCodes.has("missing_currency"),
      numberExpected === 0
        ? "No numeric tokens detected in input."
        : missingNumbers.length > 0
          ? missingNumbers.join("; ")
          : "All detected numeric tokens preserved.",
      numberExpected > 0,
    ),
    makeCheck(
      "percentages",
      !issueCodes.has("missing_percentage"),
      items.percentages.length === 0
        ? "No percentages detected."
        : issueCodes.has("missing_percentage")
          ? missingNumbers.filter((d) => d.includes("percentage")).join("; ") ||
            "Missing percentage values."
          : "All percentages preserved.",
      items.percentages.length > 0,
    ),
    makeCheck(
      "monetary_values",
      !issueCodes.has("missing_currency"),
      items.currencyValues.length === 0
        ? "No monetary values detected."
        : issueCodes.has("missing_currency")
          ? "One or more monetary values missing."
          : "All monetary values preserved.",
      items.currencyValues.length > 0,
    ),
    makeCheck(
      "citations",
      !issueCodes.has("missing_citation"),
      citationExpected
        ? missingCitations.length > 0
          ? missingCitations.join("; ")
          : "All citations preserved."
        : "No citations detected.",
      citationExpected,
    ),
    makeCheck(
      "headings",
      !issueCodes.has("missing_heading"),
      headingExpected
        ? missingHeadings.length > 0
          ? missingHeadings.join("; ")
          : "All headings preserved."
        : "No numbered headings detected.",
      headingExpected,
    ),
    makeCheck(
      "technical_terms",
      !termFail,
      missingTerms.length === 0
        ? "Important technical terms appear preserved."
        : `Possibly missing terms: ${missingTerms.slice(0, 8).join(", ")}`,
    ),
    makeCheck(
      "content_length",
      lengthRatio >= 0.55 && lengthRatio <= 1.6,
      `Output/input word ratio = ${lengthRatio.toFixed(3)}`,
    ),
    makeCheck(
      "no_truncation",
      !issueCodes.has("empty") && !issueCodes.has("abrupt_ending") && !issueCodes.has("too_short"),
      issueCodes.has("abrupt_ending") || issueCodes.has("too_short")
        ? "Output appears truncated or incomplete."
        : "No obvious truncation detected.",
    ),
  ];
}

export function buildQualityChecks(input: string, output: string): NamedCheck[] {
  const trimmed = output.trim();
  const grammarHits: string[] = [];
  for (const rule of GRAMMAR_DEGRADATION_PATTERNS) {
    const matches = trimmed.match(rule.pattern) ?? [];
    if (matches.length > 0) {
      grammarHits.push(`${rule.name}: ${matches.slice(0, 3).join(", ")}`);
    }
  }

  const repeatedOpeners = repeatedOpenerCount(trimmed);
  const fillerCount = totalFillerCount(trimmed);
  const missingTerms = findMissingTechnicalTerms(input, output);
  const smashedBoundary = /[a-z][a-z]\.[A-Z]/.test(trimmed);

  return [
    makeCheck(
      "non_empty",
      trimmed.length > 0,
      trimmed.length > 0 ? "Output is non-empty." : "Output is empty.",
    ),
    makeCheck(
      "broken_sentences",
      !smashedBoundary,
      smashedBoundary
        ? "Detected smashed sentence/paragraph boundaries."
        : "No smashed sentence boundaries detected.",
    ),
    makeCheck(
      "grammar_degradation",
      grammarHits.length === 0,
      grammarHits.length === 0
        ? "No suspicious learner-English grammar degradation patterns."
        : grammarHits.join(" | "),
    ),
    makeCheck(
      "excessive_repetition",
      repeatedOpeners < 6,
      repeatedOpeners === 0
        ? "No heavily repeated sentence openings."
        : `Repeated opener tokens counted: ${repeatedOpeners}`,
    ),
    makeCheck(
      "formulaic_transitions",
      totalFormulaicCount(trimmed) <= Math.max(3, totalFormulaicCount(input)),
      `Formulaic transitions in output: ${totalFormulaicCount(trimmed)} (input: ${totalFormulaicCount(input)})`,
    ),
    makeCheck(
      "unnecessary_filler",
      fillerCount === 0,
      fillerCount === 0
        ? "No known filler phrases detected."
        : `Filler phrase count: ${fillerCount}`,
    ),
    makeCheck(
      "obvious_meaning_loss",
      missingTerms.length < 4,
      missingTerms.length === 0
        ? "No obvious technical-term meaning loss signal."
        : `Possible meaning-loss signal via missing terms: ${missingTerms.slice(0, 6).join(", ")}`,
    ),
  ];
}

export function buildNaturalnessChecks(
  input: string,
  output: string,
): NamedCheck[] {
  const inputFormulaic = totalFormulaicCount(input);
  const outputFormulaic = totalFormulaicCount(output);
  const inputRepeated = repeatedOpenerCount(input);
  const outputRepeated = repeatedOpenerCount(output);

  return [
    makeCheck(
      "formulaic_transition_reduction",
      outputFormulaic <= inputFormulaic,
      `Input formulaic=${inputFormulaic}, output formulaic=${outputFormulaic}`,
    ),
    makeCheck(
      "repeated_opener_control",
      outputRepeated <= Math.max(inputRepeated, 3),
      `Input repeated-opener mass=${inputRepeated}, output=${outputRepeated}`,
    ),
  ];
}

export function collectFailureReasons(
  preservationChecks: NamedCheck[],
  qualityChecks: NamedCheck[],
  naturalnessChecks: NamedCheck[],
): string[] {
  return [...preservationChecks, ...qualityChecks, ...naturalnessChecks]
    .filter((check) => check.status === "fail")
    .map((check) => `${check.name}: ${check.detail ?? "failed"}`);
}

export function isPreservationGroupPassing(checks: NamedCheck[]): boolean {
  const applicable = checks.filter((check) => check.status !== "n/a");
  if (applicable.length === 0) return true;
  return applicable.every((check) => check.status === "pass");
}
