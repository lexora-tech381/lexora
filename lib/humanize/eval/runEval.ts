import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseCsv } from "@/lib/humanize/eval/csv";
import {
  buildNaturalnessChecks,
  buildPreservationChecks,
  buildQualityChecks,
  collectFailureReasons,
  isPreservationGroupPassing,
} from "@/lib/humanize/eval/checks";
import { summarizeResults } from "@/lib/humanize/eval/report";
import { loadEvalEnvFiles } from "@/lib/humanize/eval/loadEnv";
import {
  analyzeRewriteChange,
  buildNaturalnessDiagnostic,
} from "@/lib/humanize/eval/rewrite";
import type { EvalReport, SampleEvalResult } from "@/lib/humanize/eval/types";

export type RunHumanizeEvalOptions = {
  rootDir: string;
  limit?: number;
  styleKey?: string;
  writeReports?: boolean;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function runHumanizeEval(
  options: RunHumanizeEvalOptions,
): Promise<EvalReport> {
  const rootDir = options.rootDir;
  loadEvalEnvFiles(rootDir);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to app/.env.local before running evaluation.",
    );
  }

  // Import the pipeline only after env vars are available so model selection
  // and API credentials resolve correctly at runtime.
  const { runHumanizePipeline } = await import("@/lib/humanize/pipeline");

  const aiDatasetPath = path.join(rootDir, "app", "data", "AI_Generated.csv");
  const humanDatasetPath = path.join(
    rootDir,
    "app",
    "data",
    "Human-Written.csv",
  );

  const aiCsv = parseCsv(readFileSync(aiDatasetPath, "utf8"));
  const humanCsv = parseCsv(readFileSync(humanDatasetPath, "utf8"));

  const requiredColumns = ["Model", "Model_Version", "Topic", "Generated"];
  for (const column of requiredColumns) {
    if (!aiCsv.headers.includes(column)) {
      throw new Error(`AI_Generated.csv missing required column: ${column}`);
    }
  }

  const styleKey = options.styleKey ?? "Professional";
  const selectedRows = aiCsv.rows.slice(
    0,
    Math.max(1, options.limit ?? aiCsv.rows.length),
  );

  const geminiModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest";
  console.log(`Evaluation Gemini model: ${geminiModel}`);

  const results: SampleEvalResult[] = [];

  for (let index = 0; index < selectedRows.length; index += 1) {
    const row = selectedRows[index];
    const input = (row.Generated ?? "").trim();
    if (!input) {
      continue;
    }

    const pipelineResult = await runHumanizePipeline({
      text: input,
      styleKey,
    });
    const output = pipelineResult.result.trim();

    const preservationChecks = buildPreservationChecks(input, output);
    const qualityChecks = buildQualityChecks(input, output);
    const naturalnessChecks = buildNaturalnessChecks(input, output);
    const failureReasons = collectFailureReasons(
      preservationChecks,
      qualityChecks,
      naturalnessChecks,
    );

    const inputWords = countWords(input);
    const outputWords = countWords(output);
    const lengthRatio = inputWords === 0 ? 1 : outputWords / inputWords;
    const rewriteAnalysis = analyzeRewriteChange(input, output);
    const naturalnessDiagnostic = buildNaturalnessDiagnostic(
      qualityChecks,
      naturalnessChecks,
    );
    const datasetHumanizedText = row.Humanized?.trim()
      ? row.Humanized.trim()
      : null;

    const overallPass =
      isPreservationGroupPassing(preservationChecks) &&
      qualityChecks.every((check) => check.status !== "fail") &&
      naturalnessChecks.every((check) => check.status !== "fail");

    results.push({
      id: index + 1,
      topic: row.Topic || "Unknown",
      model: row.Model || "Unknown",
      modelVersion: row.Model_Version || "Unknown",
      inputText: input,
      outputText: output,
      datasetHumanizedText,
      inputLength: input.length,
      outputLength: output.length,
      inputWords,
      outputWords,
      lengthRatio,
      usedFallback: pipelineResult.usedFallback,
      repaired: pipelineResult.repaired,
      rewriteAnalysis,
      naturalnessDiagnostic,
      preservationChecks,
      qualityChecks,
      naturalnessChecks,
      overallPass,
      failureReasons,
      datasetHumanizedLength: datasetHumanizedText
        ? datasetHumanizedText.length
        : null,
    });
  }

  const report: EvalReport = {
    generatedAt: new Date().toISOString(),
    datasetPath: aiDatasetPath,
    humanWrittenReferencePath: humanDatasetPath,
    humanWrittenReferenceCount: humanCsv.rows.length,
    styleKey,
    results,
    summary: summarizeResults(results),
  };

  if (options.writeReports !== false) {
    const outDir = path.join(rootDir, "eval-results");
    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonPath = path.join(outDir, `humanize-eval-${stamp}.json`);
    const mdPath = path.join(outDir, `humanize-eval-${stamp}.md`);
    const latestJson = path.join(outDir, "latest.json");
    const latestMd = path.join(outDir, "latest.md");

    const json = JSON.stringify(report, null, 2);
    const { formatEvalReportMarkdown } = await import(
      "@/lib/humanize/eval/report"
    );
    const markdown = formatEvalReportMarkdown(report);
    writeFileSync(jsonPath, json, "utf8");
    writeFileSync(mdPath, markdown, "utf8");
    writeFileSync(latestJson, json, "utf8");
    writeFileSync(latestMd, markdown, "utf8");
  }

  return report;
}
