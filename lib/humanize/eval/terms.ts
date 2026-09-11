/**
 * Ordinary English / academic prose words that must never be treated as
 * important technical terms merely due to length or frequency.
 */
const GENERIC_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "into",
  "over",
  "under",
  "about",
  "above",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "because",
  "while",
  "where",
  "which",
  "their",
  "there",
  "these",
  "those",
  "other",
  "another",
  "using",
  "based",
  "such",
  "than",
  "then",
  "them",
  "they",
  "have",
  "has",
  "had",
  "were",
  "was",
  "are",
  "is",
  "been",
  "being",
  "also",
  "more",
  "most",
  "some",
  "any",
  "only",
  "just",
  "like",
  "many",
  "much",
  "very",
  "can",
  "may",
  "might",
  "will",
  "would",
  "could",
  "should",
  "must",
  "understanding",
  "approach",
  "process",
  "system",
  "method",
  "information",
  "result",
  "results",
  "study",
  "analysis",
  "analyzing",
  "concerned",
  "fundamental",
  "particularly",
  "companies",
  "strategies",
  "important",
  "different",
  "following",
  "including",
  "according",
  "available",
  "additional",
  "significant",
  "development",
  "performance",
  "production",
  "population",
  "application",
  "applications",
  "environment",
  "environmental",
  "consideration",
  "considerations",
  "relationship",
  "relationships",
  "accumulation",
  "determining",
  "examination",
  "examining",
  "providing",
  "required",
  "essential",
  "functions",
  "activity",
  "activities",
  "quantity",
  "quantities",
  "response",
  "example",
  "examples",
  "business",
  "medicine",
  "benefits",
  "various",
  "concepts",
  "principles",
  "valuable",
  "insights",
  "disciplines",
  "everyday",
  "planning",
  "expenses",
  "abstract",
  "predict",
  "designing",
  "optimizing",
  "consumption",
  "provides",
  "patterns",
  "ability",
  "explain",
  "beyond",
  "therefore",
  "however",
  "although",
  "moreover",
  "furthermore",
  "additionally",
  "overall",
  "generally",
  "typically",
  "effectively",
  "primarily",
  "originally",
  "eventually",
  "increasingly",
  "respectively",
]);

/** Common 2–3 letter tokens that look like acronyms but are ordinary English. */
const GENERIC_ACRONYMS = new Set([
  "a",
  "i",
  "or",
  "in",
  "on",
  "at",
  "to",
  "of",
  "by",
  "as",
  "an",
  "be",
  "we",
  "it",
  "is",
  "if",
  "so",
  "no",
  "yes",
  "all",
  "and",
  "the",
  "for",
  "but",
  "not",
  "are",
  "was",
  "can",
  "may",
  "per",
  "via",
  "etc",
]);

/**
 * Small refined set of clearly domain-specific multi-word phrases.
 * Kept intentionally small — not a generic vocabulary dump.
 */
const DOMAIN_PHRASES = [
  "machine learning",
  "supervised learning",
  "unsupervised learning",
  "reinforcement learning",
  "cellular respiration",
  "artificial intelligence",
  "industrial revolution",
  "agricultural revolution",
  "supply and demand",
  "gross domestic product",
  "natural selection",
  "steam engine",
] as const;

/** Strong scientific/technical morphology — not ordinary prose endings. */
const DOMAIN_MORPHOLOGY =
  /(?:chondria|cytes?|plast|zyme|genomics|proteomics|transcriptomics|metabolomics|ogenesis|olysis|opathy|philic|phobic|metry|kinase|oxide|enzyme)$/i;

function addTerm(terms: string[], seen: Set<string>, term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const key = trimmed.toLowerCase();
  if (seen.has(key)) return;
  if (GENERIC_WORDS.has(key)) return;
  seen.add(key);
  terms.push(trimmed);
}

function isDomainHyphenatedCompound(token: string): boolean {
  if (!token.includes("-")) return false;
  const parts = token.toLowerCase().split("-").filter(Boolean);
  if (parts.length < 2) return false;
  if (parts.some((part) => part.length < 3)) return false;
  if (parts.every((part) => GENERIC_WORDS.has(part))) return false;
  return parts.join("-").length >= 8;
}

function looksScientificSingleToken(token: string): boolean {
  const lower = token.toLowerCase();
  if (lower.length < 8) return false;
  if (GENERIC_WORDS.has(lower)) return false;
  if (DOMAIN_MORPHOLOGY.test(lower)) return true;
  if (isDomainHyphenatedCompound(lower)) return true;
  // Letter+digit technical tokens (e.g. co2, h2o, covid-19 handled elsewhere).
  if (/[a-z]+[0-9]+|[0-9]+[a-z]+/i.test(token)) return true;
  return false;
}

/**
 * Conservative technical-term extractor for regression checks.
 * Prefers multi-word domain phrases, acronyms, notation, and clearly
 * domain-specific tokens — not ordinary long English words.
 */
export function extractImportantTechnicalTerms(text: string): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();

  const multiWord = text.match(
    /\b[A-Z][A-Za-z0-9]+(?:[ -][A-Z][A-Za-z0-9]+){1,3}\b/g,
  );
  for (const phrase of multiWord ?? []) {
    addTerm(terms, seen, phrase);
  }

  const lower = text.toLowerCase();
  for (const phrase of DOMAIN_PHRASES) {
    if (lower.includes(phrase)) {
      addTerm(terms, seen, phrase);
    }
  }

  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) ?? [];
  for (const acronym of acronyms) {
    if (GENERIC_ACRONYMS.has(acronym.toLowerCase())) continue;
    addTerm(terms, seen, acronym);
  }

  const mathLike =
    text.match(
      /\b[A-Za-z]*\d+[A-Za-z0-9]*\b|\b[A-Za-z]+\^[0-9]+\b|\b\d+\s*[+\-*/=]\s*\d+\b/g,
    ) ?? [];
  for (const token of mathLike) {
    if (/^\d+$/.test(token)) continue;
    addTerm(terms, seen, token);
  }

  const candidates = text.match(/[A-Za-z][A-Za-z0-9-]{6,}/g) ?? [];
  for (const token of candidates) {
    if (!looksScientificSingleToken(token)) continue;
    addTerm(terms, seen, token);
  }

  return terms.slice(0, 24);
}

export function findMissingTechnicalTerms(
  input: string,
  output: string,
): string[] {
  const terms = extractImportantTechnicalTerms(input);
  const outputLower = output.toLowerCase();
  return terms.filter((term) => !outputLower.includes(term.toLowerCase()));
}
