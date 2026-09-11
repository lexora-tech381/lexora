export function resolveHumanizeStyle(styleKey: unknown): string {
  const core =
    "Substantially rewrite the wording and sentence structure while preserving the original meaning and all factual information. Preserving content does not mean preserving the original wording.";

  if (typeof styleKey !== "string" || styleKey.trim().length === 0) {
    return `${core} Keep the writing appropriate for professional contexts.`;
  }

  const normalized = styleKey.trim();

  if (normalized === "Academic") {
    return `${core} Keep the writing academically appropriate. Do not make it casual.`;
  }

  if (normalized === "Professional") {
    return `${core} Keep the writing professional and clear.`;
  }

  if (
    normalized === "Friendly" ||
    normalized === "Simple" ||
    normalized === "Natural"
  ) {
    return `${core} Preserve the original tone. Only use a lighter tone if the source is already casual.`;
  }

  return `${core} Keep the writing appropriate for professional contexts.`;
}

export function buildRewritePrompt(
  stylePersona: string,
  sourceText: string,
  preservationItems: string[],
): string {
  const preserveBlock =
    preservationItems.length > 0
      ? preservationItems.map((item) => `- ${item}`).join("\n")
      : "- (no special tokens detected beyond full factual content)";

  return `${stylePersona}

Your task is a genuine rewrite, not a proofread.

Rewrite the source text so it is clearly different in wording and sentence structure while keeping the same meaning and all important information.

You MUST:
- Produce a substantial rewrite of suitable prose. Do not merely tidy grammar, fix punctuation, or lightly paraphrase.
- Vary sentence openings naturally.
- Restructure clauses and rearrange sentence order within a paragraph when that improves clarity.
- Replace repetitive wording with natural alternatives.
- Combine or split sentences when that improves readability.
- Vary sentence length naturally.
- Prefer direct, natural phrasing over inflated or unnecessarily formal vocabulary.
- Avoid generic AI-style transitions (for example: furthermore, moreover, additionally, in conclusion, it is important to note).
- Keep paragraphs and formatting coherent.

You MUST NOT:
- Copy the source sentence-by-sentence with only minor wording changes.
- Return text that is essentially identical to the source.
- Invent facts, add new arguments, or remove information.
- Change the author's intended conclusion.
- Intentionally introduce grammar errors.
- Add filler.
- Make the writing unnecessarily casual.

Preserve exactly (factually unchanged):
- numbers, percentages, monetary values, dates, names
- citations, URLs, headings, section numbering
- technical terminology, formulas/equations, quoted text
- factual claims and the relationships between claims

Example of the desired rewrite depth:
Input: "Businesses should therefore investigate missing regional information rather than assuming that the 'Unknown' group represents a specific customer segment."
Good rewrite: "Rather than treating the 'Unknown' group as a defined customer segment, businesses should first investigate why regional information is missing."

Do not force every single sentence to change, but the overall passage must be meaningfully rewritten when the source contains substantial prose.

Preserve formatting as much as possible: headings, paragraphs, bullets, numbered sections, line breaks, and markdown structure.
Start from the beginning of the source. Do not skip opening content.
Return ONLY the rewritten text.

These exact items must remain in the output:
${preserveBlock}

SOURCE TEXT:
${sourceText}`;
}

export function buildRepairPrompt(params: {
  stylePersona: string;
  sourceText: string;
  failedRewrite: string;
  missingItems: string[];
  issueDetails: string[];
}): string {
  const missingBlock =
    params.missingItems.length > 0
      ? params.missingItems.map((item) => `- ${item}`).join("\n")
      : "- (see issue details below)";

  const issueBlock =
    params.issueDetails.length > 0
      ? params.issueDetails.map((item) => `- ${item}`).join("\n")
      : "- Preservation validation failed.";

  return `${params.stylePersona}

The previous rewrite failed preservation checks. Rewrite the text again.

Keep making a genuine rewrite with different wording and sentence structure. Do not fall back to lightly editing or copying the original.

Every required number, percentage, monetary value, citation, heading, factual detail, and technical term must remain. Do not remove or invent information. Preserve formatting and paragraph order. Return only the corrected rewritten text.

VALIDATION ISSUES:
${issueBlock}

MISSING OR BROKEN ITEMS THAT MUST APPEAR EXACTLY:
${missingBlock}

ORIGINAL TEXT:
${params.sourceText}

FAILED REWRITE:
${params.failedRewrite}`;
}

export function buildWeakRewritePrompt(params: {
  stylePersona: string;
  sourceText: string;
  weakRewrite: string;
  preservationItems: string[];
}): string {
  const preserveBlock =
    params.preservationItems.length > 0
      ? params.preservationItems.map((item) => `- ${item}`).join("\n")
      : "- (no special tokens detected beyond full factual content)";

  return `${params.stylePersona}

The previous attempt was too close to the original. It reads like a light edit or near-copy, not a real rewrite.

Rewrite the original text again with clearly different wording and sentence structure while preserving meaning and all factual information.

Requirements:
- Do not proofread. Do not lightly paraphrase.
- Restructure sentences and clauses.
- Vary openings and sentence length.
- Keep all facts, numbers, citations, headings, quotes, URLs, and technical terms intact.
- Do not invent or remove information.
- Return ONLY the rewritten text.

These exact items must remain in the output:
${preserveBlock}

ORIGINAL TEXT:
${params.sourceText}

WEAK PREVIOUS ATTEMPT (do not imitate its near-copying):
${params.weakRewrite}`;
}
