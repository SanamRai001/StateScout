import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { evaluateSelectiveRevalidation } from "../benchmarks/selective-revalidation/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-15-selective-revalidation.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");

const result = evaluateSelectiveRevalidation();

const report = {
  schemaVersion: 1,
  experiment: "phase-15-selective-revalidation",
  runtime: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  generatedAt: new Date().toISOString(),
  budget: result.plan.budget,
  ranking: result.plan.ranking,
  selected: result.plan.selected,
  skipped: result.plan.skipped,
  selectedFraction: result.selectedFraction,
  savedRuleProbes: result.savedRuleProbes,
  statesBefore: result.statesBefore,
  statesAfterSelectedEvidence:
    result.statesAfterSelectedEvidence,
  selectedDecision: result.selectedDecision,
  untouchedDecisions: result.untouchedDecisions,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const rankingSummary = result.plan.ranking
  .map(({ anchorHash, score }) => `${anchorHash}:${score}`)
  .join(" > ");

const selectedSummary = result.plan.selected
  .map(({ anchorHash }) => anchorHash)
  .join(", ");

const untouchedPreserved = result.untouchedDecisions.every(
  (decision) => decision.status === "insufficient-evidence",
);

const summary = [
  "Phase 15 selective-revalidation summary",
  `Rules ranked: ${result.plan.ranking.length}`,
  `Revalidation budget: ${result.plan.budget}`,
  `Ranking: ${rankingSummary}`,
  `Selected anchors: ${selectedSummary}`,
  `Selected fraction: ${result.selectedFraction}`,
  `Saved rule probes: ${result.savedRuleProbes}`,
  `Selected rule decision: ${result.selectedDecision?.status ?? "none"}`,
  `Untouched rule states preserved: ${untouchedPreserved}`,
  `Full JSON: ${outputPath}`,
].join("\n") + "\n";

await writeFile(summaryPath, summary, "utf8");
console.log(summary.trim());
console.log(`Summary file: ${summaryPath}`);
