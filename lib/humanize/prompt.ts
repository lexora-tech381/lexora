export function resolveHumanizeStyle(styleKey: unknown): string {
  const core =
    "Substantially rewrite wording and sentence structure while preserving meaning and all factual information. Preserving content does not mean preserving the original wording. Keep the author's natural level of formality — clear and professional, never ornate or over-polished.";

  if (typeof styleKey !== "string" || styleKey.trim().length === 0) {
    return `${core} Keep the writing appropriate for professional contexts.`;
  }

  const normalized = styleKey.trim();

  if (normalized === "Academic") {
    return `${core} Keep the writing academically appropriate and credible. Do not make it casual, and do not make it more elaborate than the source.`;
  }

  if (normalized === "Professional") {
    return `${core} Keep the writing professional, clear, and readable.`;
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

Your task is a genuine rewrite, not a proofread and not a sophistication upgrade.

Rewrite the source so it is meaningfully different in wording and structure while keeping the same meaning and all important information. Aim for NATURAL + CLEAR + PROFESSIONAL writing.

You MUST:
- Produce a real rewrite of suitable prose. Do not merely tidy grammar or lightly paraphrase.
- Prefer simple, natural wording when it communicates the same meaning.
- Preserve the author's natural level of formality. Do not automatically make ordinary academic or business writing more elaborate.
- Vary sentence openings and restructure clauses when that improves clarity or flow.
- Replace repetitive wording with natural alternatives — not fancier synonyms.
- Combine or split sentences when that improves readability.
- Keep a natural mix of short, medium, and longer sentences. Do not polish every sentence into the same formal style.
- For factual or analytical writing, prioritize precision and readability over stylistic sophistication.
- Preserve the writer's intended level of confidence. Do not strengthen weak claims, weaken strong claims, or add interpretations.
- Avoid stock AI-sounding transitions and rhetorical phrases unless they are genuinely needed (for example: furthermore, moreover, additionally, in conclusion, it is important to note).
- Keep paragraphs and formatting coherent.

You MUST NOT:
- Inflate wording or swap in unnecessarily sophisticated synonyms.
- Prefer elaborate phrasing over plain phrasing that already works.
- Force every sentence to be dramatically different.
- Rewrite purely for the sake of changing words.
- Copy the source sentence-by-sentence with only minor wording changes.
- Return text that is essentially identical to the source.
- Invent facts, add new arguments, or remove information.
- Change the author's intended conclusion.
- Intentionally introduce grammar errors.
- Add filler.
- Make the writing unnecessarily casual.

Avoid synonym inflation like:
- "customers" → "demographic" / "the male demographic"
- "before" → "prior to"
- "followed by" → "succeeded sequentially by"
- "should not" → "ought not to"
- "avoid" → "steer clear of"
- plain statements rewritten into ornate constructions that "suffer in precision"

Good natural rewrite:
Input: "Sales were not evenly distributed across regions. The East region recorded the highest total sales, followed by North, West, and South."
Good: "Sales varied across the regions. East recorded the highest total sales, followed by North, West, and South."
Not desired: "Sales figures exhibited considerable geographical variation, with the East emerging as the predominant territory in terms of overall revenue generation."

Another good natural rewrite:
Input: "Prior to data refinement, the West recorded the peak order count at 246, closely followed by the South with 244 orders."
Better direction: "Before cleaning, the West had the highest number of orders, with 246, followed by the South with 244."

Structural rewrite example (content preserved, wording changed naturally):
Input: "Businesses should therefore investigate missing regional information rather than assuming that the 'Unknown' group represents a specific customer segment."
Good: "Rather than treating the 'Unknown' group as a defined customer segment, businesses should first investigate why regional information is missing."

Do not force every single sentence to change, but the overall passage must be meaningfully rewritten when the source contains substantial prose.

Preserve exactly (factually unchanged):
- numbers, percentages, monetary values, dates, names
- citations, URLs, headings, section numbering
- technical terminology, formulas/equations, quoted text
- factual claims and the relationships between claims

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

Keep a genuine rewrite with different wording and sentence structure, but stay natural and clear — do not make the writing more ornate or synonym-heavy. Do not fall back to lightly editing or copying the original.

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
- Restructure sentences and clauses where useful.
- Prefer simple, natural wording — not fancier synonyms.
- Keep the author's natural formality. Do not make the text more elaborate.
- Vary openings and sentence length naturally.
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
