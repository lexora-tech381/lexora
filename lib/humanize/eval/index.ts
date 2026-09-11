/**
 * Local-only humanize evaluation helpers.
 * Not used by production API routes.
 */
export { runHumanizeEval } from "@/lib/humanize/eval/runEval";
export { formatEvalReportMarkdown } from "@/lib/humanize/eval/report";
export {
  analyzeRewriteChange,
  buildNaturalnessDiagnostic,
} from "@/lib/humanize/eval/rewrite";
export type {
  EvalReport,
  EvalSummary,
  NaturalnessDiagnostic,
  RewriteAnalysis,
  SampleEvalResult,
} from "@/lib/humanize/eval/types";
