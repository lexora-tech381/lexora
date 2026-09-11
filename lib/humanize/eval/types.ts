export type CheckStatus = "pass" | "fail" | "n/a";

export type NamedCheck = {
  name: string;
  status: CheckStatus;
  detail?: string;
};

export type RewriteAnalysis = {
  exactMatch: boolean;
  exactNormalizedMatch: boolean;
  /** Normalized character similarity in [0, 1]. 1 = identical. Not "better when lower". */
  characterSimilarity: number;
  /** Multiset word overlap ratio in [0, 1]. */
  wordOverlapRatio: number;
  wordOverlapPercentage: number;
  changedWordCount: number;
  /** Percentage of input words not preserved in the output multiset. Always in [0, 100]. */
  changedWordPercentage: number;
  inputSentenceCount: number;
  outputSentenceCount: number;
  changedSentenceCount: number;
  lengthRatio: number;
};

export type NaturalnessDiagnostic = {
  label: string;
  note: string;
  checksConsidered: string[];
  passCount: number;
  failCount: number;
  /** 0–1 pass rate among naturalness-related diagnostic checks. Not a human score. */
  score: number;
};

export type SampleEvalResult = {
  id: number;
  topic: string;
  model: string;
  modelVersion: string;
  inputText: string;
  outputText: string;
  /** Diagnostic comparison only — never used as ground truth. */
  datasetHumanizedText: string | null;
  inputLength: number;
  outputLength: number;
  inputWords: number;
  outputWords: number;
  lengthRatio: number;
  usedFallback: boolean;
  repaired: boolean;
  rewriteAnalysis: RewriteAnalysis;
  naturalnessDiagnostic: NaturalnessDiagnostic;
  preservationChecks: NamedCheck[];
  qualityChecks: NamedCheck[];
  naturalnessChecks: NamedCheck[];
  overallPass: boolean;
  failureReasons: string[];
  /** Diagnostic only — never used as ground truth. */
  datasetHumanizedLength: number | null;
};

export type EvalSummary = {
  sampleCount: number;
  overallPassCount: number;
  overallPassRate: number;
  preservationPassRate: number;
  qualityPassRate: number;
  naturalnessPassRate: number;
  citationPreservationRate: number;
  numberPreservationRate: number;
  headingPreservationRate: number;
  truncationOrFailureRate: number;
  averageCharacterSimilarity: number;
  averageWordOverlapPercentage: number;
  averageChangedWordPercentage: number;
  averageLengthRatio: number;
  averageNaturalnessDiagnosticScore: number;
  fallbackRate: number;
  repairRate: number;
  averageInputLength: number;
  averageOutputLength: number;
};

export type EvalReport = {
  generatedAt: string;
  datasetPath: string;
  humanWrittenReferencePath: string;
  humanWrittenReferenceCount: number;
  styleKey: string;
  results: SampleEvalResult[];
  summary: EvalSummary;
};
