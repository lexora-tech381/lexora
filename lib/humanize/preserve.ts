export type PreservationItems = {
  numbers: string[];
  percentages: string[];
  currencyValues: string[];
  citations: string[];
  headings: string[];
  urls: string[];
  quotedTexts: string[];
};

export type ValidationIssue = {
  code:
    | "empty"
    | "too_short"
    | "missing_number"
    | "missing_percentage"
    | "missing_currency"
    | "missing_citation"
    | "missing_heading"
    | "missing_url"
    | "missing_quote"
    | "abrupt_ending";
  detail: string;
};

export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
  missingItems: string[];
};

const PERCENTAGE_PATTERN = /\d{1,3}(?:,\d{3})*(?:\.\d+)?%/g;
const CURRENCY_PATTERN =
  /(?:\$|€|£)\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:\s?(?:USD|EUR|GBP|CAD|AUD))?/g;
const NUMBER_PATTERN = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\d+/g;
const CITATION_PATTERN =
  /\([A-Z][^()\n]{0,100}?,\s*\d{4}[a-z]?\)/g;
const HEADING_PATTERN =
  /^(?:#{1,6}\s+)?\d+(?:\.\d+)*\.?\s+[A-Z0-9].+$/gm;
const URL_PATTERN = /https?:\/\/[^\s)\]>"']+/gi;
const QUOTE_PATTERN = /"([^"\n]{8,})"|'([^'\n]{8,})'/g;

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }

  return result;
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern) ?? [];
  return uniquePreserveOrder(matches.map((match) => match.trim()));
}

function isCoveredByLongerToken(candidate: string, tokens: string[]): boolean {
  return tokens.some(
    (token) => token !== candidate && token.includes(candidate),
  );
}

export function extractPreservationItems(text: string): PreservationItems {
  const percentages = collectMatches(text, PERCENTAGE_PATTERN);
  const currencyValues = collectMatches(text, CURRENCY_PATTERN);
  const citations = collectMatches(text, CITATION_PATTERN);
  const headings = collectMatches(text, HEADING_PATTERN);
  const urls = collectMatches(text, URL_PATTERN);

  const quotedTexts: string[] = [];
  for (const match of text.matchAll(QUOTE_PATTERN)) {
    const quoted = (match[1] || match[2] || "").trim();
    if (quoted) quotedTexts.push(quoted);
  }

  const rawNumbers = collectMatches(text, NUMBER_PATTERN).filter((number) => {
    if (percentages.some((percent) => percent.includes(number))) return false;
    if (currencyValues.some((amount) => amount.includes(number))) return false;
    if (citations.some((citation) => citation.includes(number))) return false;
    if (headings.some((heading) => heading.startsWith(number))) return false;
    if (isCoveredByLongerToken(number, currencyValues)) return false;
    return true;
  });

  return {
    numbers: rawNumbers,
    percentages,
    currencyValues,
    citations,
    headings,
    urls,
    quotedTexts: uniquePreserveOrder(quotedTexts),
  };
}

export function listCriticalPreservationItems(
  items: PreservationItems,
): string[] {
  return uniquePreserveOrder([
    ...items.percentages,
    ...items.currencyValues,
    ...items.numbers,
    ...items.citations,
    ...items.headings,
    ...items.urls,
  ]);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function looksAbruptlyCutOff(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (/[.!?:;"')\]]["']?$/.test(trimmed)) {
    return false;
  }

  // Allow headings/list items that intentionally end without punctuation.
  const lastLine = trimmed.split("\n").pop()?.trim() ?? "";
  if (/^(?:#{1,6}\s+|\d+(?:\.\d+)*\.?\s+|[-*•]\s+)/.test(lastLine)) {
    return false;
  }

  // Short outputs are handled by length checks; treat long unpunctuated endings as suspicious.
  return countWords(trimmed) >= 40;
}

function findMissingExact(required: string[], output: string): string[] {
  return required.filter((item) => !output.includes(item));
}

export function validatePreservation(
  originalText: string,
  rewrittenText: string,
  items: PreservationItems = extractPreservationItems(originalText),
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const missingItems: string[] = [];
  const output = rewrittenText.trim();

  if (!output) {
    return {
      isValid: false,
      issues: [{ code: "empty", detail: "Rewritten output was empty." }],
      missingItems: listCriticalPreservationItems(items),
    };
  }

  const originalWords = countWords(originalText);
  const outputWords = countWords(output);
  const minimumWords = Math.max(12, Math.floor(originalWords * 0.55));

  if (originalWords >= 20 && outputWords < minimumWords) {
    issues.push({
      code: "too_short",
      detail: `Output has ${outputWords} words but at least ${minimumWords} were expected.`,
    });
  }

  if (looksAbruptlyCutOff(output)) {
    issues.push({
      code: "abrupt_ending",
      detail: "Output appears to end abruptly without completing the sentence.",
    });
  }

  const missingNumbers = findMissingExact(items.numbers, output);
  for (const value of missingNumbers) {
    missingItems.push(value);
    issues.push({
      code: "missing_number",
      detail: `Missing number: ${value}`,
    });
  }

  const missingPercentages = findMissingExact(items.percentages, output);
  for (const value of missingPercentages) {
    missingItems.push(value);
    issues.push({
      code: "missing_percentage",
      detail: `Missing percentage: ${value}`,
    });
  }

  const missingCurrency = findMissingExact(items.currencyValues, output);
  for (const value of missingCurrency) {
    missingItems.push(value);
    issues.push({
      code: "missing_currency",
      detail: `Missing monetary value: ${value}`,
    });
  }

  const missingCitations = findMissingExact(items.citations, output);
  for (const value of missingCitations) {
    missingItems.push(value);
    issues.push({
      code: "missing_citation",
      detail: `Missing citation: ${value}`,
    });
  }

  const missingHeadings = findMissingExact(items.headings, output);
  for (const value of missingHeadings) {
    missingItems.push(value);
    issues.push({
      code: "missing_heading",
      detail: `Missing heading: ${value}`,
    });
  }

  const missingUrls = findMissingExact(items.urls, output);
  for (const value of missingUrls) {
    missingItems.push(value);
    issues.push({
      code: "missing_url",
      detail: `Missing URL: ${value}`,
    });
  }

  const missingQuotes = findMissingExact(items.quotedTexts, output);
  for (const value of missingQuotes) {
    missingItems.push(value);
    issues.push({
      code: "missing_quote",
      detail: `Missing quoted text: ${value}`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    missingItems: uniquePreserveOrder(missingItems),
  };
}
