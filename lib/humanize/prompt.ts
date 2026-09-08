export function resolveHumanizeStyle(styleKey: unknown): string {
  const core =
    "Rewrite the writing naturally WITHOUT losing, changing, inventing, or rearranging important information.";

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

Rewrite the source text so it reads naturally, clearly, and fluently.

Requirements:
- Preserve meaning and all factual information.
- Preserve every important detail.
- Preserve all numbers, percentages, monetary values, dates, names, citations, URLs, headings, section numbers, bullet/list structure, quoted text, and technical terms.
- Improve naturalness and readability.
- Vary sentence structure naturally.
- Avoid repetitive wording and robotic/formulaic phrasing.
- Maintain the original tone.
- Academic text must remain academically appropriate.
- Professional text must remain professional.
- Do not intentionally introduce grammar errors.
- Do not add facts.
- Do not add filler.
- Do not make writing unnecessarily casual.
- Preserve formatting as much as possible: headings, paragraphs, bullets, numbered sections, line breaks, and markdown structure.
- Start from the beginning of the source. Do not skip opening content.
- Return ONLY the rewritten text.

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
