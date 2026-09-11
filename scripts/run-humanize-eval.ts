import path from "node:path";
import { loadEvalEnvFiles } from "../lib/humanize/eval/loadEnv";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const rootDir = process.cwd();

  // Load env before importing any Gemini-dependent evaluation modules.
  loadEvalEnvFiles(rootDir);

  const { runHumanizeEval } = await import("../lib/humanize/eval/runEval");
  const { formatEvalReportMarkdown } = await import(
    "../lib/humanize/eval/report"
  );

  const limitRaw = readArg("--limit");
  const styleKey = readArg("--style") ?? "Professional";
  const limit = hasFlag("--all")
    ? undefined
    : limitRaw
      ? Number.parseInt(limitRaw, 10)
      : 3;

  if (limitRaw && Number.isNaN(Number(limit))) {
    throw new Error(`Invalid --limit value: ${limitRaw}`);
  }

  const geminiModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest";

  console.log("Lexora local humanize evaluation");
  console.log(`Root: ${rootDir}`);
  console.log(`Style: ${styleKey}`);
  console.log(`Gemini model: ${geminiModel}`);
  console.log(
    `Samples: ${hasFlag("--all") ? "all" : String(limit ?? 3)} (dataset stays local; not exposed via API)`,
  );
  console.log("");

  const report = await runHumanizeEval({
    rootDir,
    limit,
    styleKey,
    writeReports: true,
  });

  console.log(formatEvalReportMarkdown(report));
  console.log("");
  console.log(`Wrote reports to: ${path.join(rootDir, "eval-results")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Evaluation failed.");
  process.exitCode = 1;
});
