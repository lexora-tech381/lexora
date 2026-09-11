import type {
  EvalReport,
  EvalSummary,
  NamedCheck,
  SampleEvalResult,
} from "@/lib/humanize/eval/types";

function formatChecks(checks: NamedCheck[]): string {
  return checks
    .map((check) => {
      const mark =
        check.status === "pass" ? "PASS" : check.status === "fail" ? "FAIL" : "N/A";
      return `    - [${mark}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`;
    })
    .join("\n");
}

function rate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fence(label: string, text: string): string {
  return [`#### ${label}`, "", "```text", text || "(empty)", "```", ""].join(
    "\n",
  );
}

export function formatEvalReportMarkdown(report: EvalReport): string {
  const lines: string[] = [];
  lines.push("# Lexora Humanize Evaluation Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push(`Dataset: ${report.datasetPath}`);
  lines.push(
    `Human-written reference samples loaded: ${report.humanWrittenReferenceCount} (${report.humanWrittenReferencePath})`,
  );
  lines.push(`Style key: ${report.styleKey}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Samples evaluated: ${report.summary.sampleCount}`);
  lines.push(
    `- Overall pass rate: ${rate(report.summary.overallPassRate)} (${report.summary.overallPassCount}/${report.summary.sampleCount})`,
  );
  lines.push(
    `- Preservation pass rate: ${rate(report.summary.preservationPassRate)}`,
  );
  lines.push(`- Quality pass rate: ${rate(report.summary.qualityPassRate)}`);
  lines.push(
    `- Naturalness pass rate: ${rate(report.summary.naturalnessPassRate)}`,
  );
  lines.push(
    `- Citation preservation rate: ${rate(report.summary.citationPreservationRate)}`,
  );
  lines.push(
    `- Number preservation rate: ${rate(report.summary.numberPreservationRate)}`,
  );
  lines.push(
    `- Heading preservation rate: ${rate(report.summary.headingPreservationRate)}`,
  );
  lines.push(
    `- Truncation/failure rate: ${rate(report.summary.truncationOrFailureRate)}`,
  );
  lines.push(
    `- Average character similarity (1 = identical): ${report.summary.averageCharacterSimilarity.toFixed(3)}`,
  );
  lines.push(
    `- Average word overlap: ${report.summary.averageWordOverlapPercentage.toFixed(1)}%`,
  );
  lines.push(
    `- Average changed-word percentage: ${report.summary.averageChangedWordPercentage.toFixed(1)}%`,
  );
  lines.push(
    `- Average length ratio (output÷input words): ${report.summary.averageLengthRatio.toFixed(3)}`,
  );
  lines.push(
    `- Average naturalness diagnostic score (check pass rate, not a human score): ${report.summary.averageNaturalnessDiagnosticScore.toFixed(3)}`,
  );
  lines.push(`- Fallback rate: ${rate(report.summary.fallbackRate)}`);
  lines.push(`- Repair rate: ${rate(report.summary.repairRate)}`);
  lines.push(
    `- Average input length: ${Math.round(report.summary.averageInputLength)} chars`,
  );
  lines.push(
    `- Average output length: ${Math.round(report.summary.averageOutputLength)} chars`,
  );
  lines.push("");
  lines.push(
    "Note: These checks are regression/quality diagnostics. They do not prove text is human-written.",
  );
  lines.push(
    "Similarity and rewrite metrics measure change vs input only — lower similarity is not automatically better.",
  );
  lines.push(
    "The dataset Humanized column is loaded for diagnostics only and is not treated as ground truth.",
  );
  lines.push("");
  lines.push("## Per-sample results");
  lines.push("");

  for (const sample of report.results) {
    const rewrite = sample.rewriteAnalysis;
    const naturalness = sample.naturalnessDiagnostic;

    lines.push(`### Sample ${sample.id}: ${sample.topic}`);
    lines.push("");
    lines.push(`- Model: ${sample.model} (${sample.modelVersion})`);
    lines.push(`- Topic: ${sample.topic}`);
    lines.push(`- Input length: ${sample.inputLength} chars / ${sample.inputWords} words`);
    lines.push(
      `- Output length: ${sample.outputLength} chars / ${sample.outputWords} words`,
    );
    lines.push(`- Length ratio (output÷input words): ${sample.lengthRatio.toFixed(3)}`);
    lines.push(`- Pipeline fallback used: ${sample.usedFallback ? "yes" : "no"}`);
    lines.push(`- Pipeline repaired: ${sample.repaired ? "yes" : "no"}`);
    lines.push(`- Overall: ${sample.overallPass ? "PASS" : "FAIL"}`);
    lines.push("- Rewrite/change analysis:");
    lines.push(`    - exact match: ${rewrite.exactMatch ? "yes" : "no"}`);
    lines.push(
      `    - exact normalized match: ${rewrite.exactNormalizedMatch ? "yes" : "no"}`,
    );
    lines.push(
      `    - character similarity: ${rewrite.characterSimilarity.toFixed(3)}`,
    );
    lines.push(
      `    - word overlap: ${rewrite.wordOverlapPercentage.toFixed(1)}%`,
    );
    lines.push(
      `    - changed input words: ${rewrite.changedWordCount}`,
    );
    lines.push(
      `    - changed-word percentage (% of input words replaced): ${rewrite.changedWordPercentage.toFixed(1)}%`,
    );
    lines.push(
      `    - sentences: input=${rewrite.inputSentenceCount}, output=${rewrite.outputSentenceCount}, changed≈${rewrite.changedSentenceCount}`,
    );
    lines.push(
      `- Naturalness diagnostic score: ${naturalness.score.toFixed(3)} (${naturalness.passCount}/${naturalness.passCount + naturalness.failCount} related checks passed; not a human score)`,
    );
    if (sample.failureReasons.length > 0) {
      lines.push("- Failure reasons:");
      for (const reason of sample.failureReasons) {
        lines.push(`  - ${reason}`);
      }
    }
    lines.push("- Preservation checks:");
    lines.push(formatChecks(sample.preservationChecks));
    lines.push("- Quality checks:");
    lines.push(formatChecks(sample.qualityChecks));
    lines.push("- Naturalness checks:");
    lines.push(formatChecks(sample.naturalnessChecks));
    lines.push("");
    lines.push(fence("Original input", sample.inputText));
    lines.push(fence("Lexora output", sample.outputText));
    lines.push(
      fence(
        "Dataset Humanized (diagnostic only — not ground truth)",
        sample.datasetHumanizedText ?? "(not provided)",
      ),
    );
  }

  return lines.join("\n");
}

function groupPassRate(
  results: SampleEvalResult[],
  pick: (result: SampleEvalResult) => NamedCheck[],
): number {
  if (results.length === 0) return 0;
  const passing = results.filter((result) => {
    const applicable = pick(result).filter((check) => check.status !== "n/a");
    if (applicable.length === 0) return true;
    return applicable.every((check) => check.status === "pass");
  }).length;
  return passing / results.length;
}

function namedCheckPassRate(
  results: SampleEvalResult[],
  checkName: string,
): number {
  const applicable = results.filter((result) =>
    result.preservationChecks.some(
      (check) => check.name === checkName && check.status !== "n/a",
    ),
  );
  if (applicable.length === 0) return 1;
  const pass = applicable.filter((result) =>
    result.preservationChecks.some(
      (check) => check.name === checkName && check.status === "pass",
    ),
  ).length;
  return pass / applicable.length;
}

export function summarizeResults(results: SampleEvalResult[]): EvalSummary {
  const sampleCount = results.length;
  const overallPassCount = results.filter((result) => result.overallPass).length;

  const truncationFails = results.filter((result) =>
    result.preservationChecks.some(
      (check) => check.name === "no_truncation" && check.status === "fail",
    ),
  ).length;

  const average = (selector: (result: SampleEvalResult) => number) =>
    sampleCount === 0
      ? 0
      : results.reduce((sum, result) => sum + selector(result), 0) / sampleCount;

  return {
    sampleCount,
    overallPassCount,
    overallPassRate: sampleCount === 0 ? 0 : overallPassCount / sampleCount,
    preservationPassRate: groupPassRate(
      results,
      (result) => result.preservationChecks,
    ),
    qualityPassRate: groupPassRate(results, (result) => result.qualityChecks),
    naturalnessPassRate: groupPassRate(
      results,
      (result) => result.naturalnessChecks,
    ),
    citationPreservationRate: namedCheckPassRate(results, "citations"),
    numberPreservationRate: namedCheckPassRate(results, "numbers"),
    headingPreservationRate: namedCheckPassRate(results, "headings"),
    truncationOrFailureRate:
      sampleCount === 0 ? 0 : truncationFails / sampleCount,
    averageCharacterSimilarity: average(
      (result) => result.rewriteAnalysis.characterSimilarity,
    ),
    averageWordOverlapPercentage: average(
      (result) => result.rewriteAnalysis.wordOverlapPercentage,
    ),
    averageChangedWordPercentage: average(
      (result) => result.rewriteAnalysis.changedWordPercentage,
    ),
    averageLengthRatio: average((result) => result.lengthRatio),
    averageNaturalnessDiagnosticScore: average(
      (result) => result.naturalnessDiagnostic.score,
    ),
    fallbackRate:
      sampleCount === 0
        ? 0
        : results.filter((result) => result.usedFallback).length / sampleCount,
    repairRate:
      sampleCount === 0
        ? 0
        : results.filter((result) => result.repaired).length / sampleCount,
    averageInputLength: average((result) => result.inputLength),
    averageOutputLength: average((result) => result.outputLength),
  };
}
