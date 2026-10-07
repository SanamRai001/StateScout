import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluatePhase18 } from "../benchmarks/corpus-v1/phase18Evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-18-baselines-ablations.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const fixtureRootUrl = pathToFileURL(
  resolve("benchmarks/corpus-v1") + sep,
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const result = await evaluatePhase18(page, fixtureRootUrl);

  const strategies = Object.entries(result.strategies).map(
    ([name, metrics]) => ({
      name,
      total: metrics.total,
      correct: metrics.correct,
      accuracy: metrics.accuracy,
      falseMerges: metrics.falseMerges,
      falseSplits: metrics.falseSplits,
      failures: metrics.cases
        .filter((candidate) => !candidate.correct)
        .map((candidate) => candidate.id),
      families: metrics.families,
    }),
  );

  const report = {
    schemaVersion: 1,
    experiment: "phase-18-baselines-ablations",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    observedPairs: result.pairs.length,
    strategies,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const strategyLines = strategies.map(
    (strategy) =>
      `${strategy.name}: ${strategy.correct}/${strategy.total}, accuracy=${strategy.accuracy}, FM=${strategy.falseMerges}, FS=${strategy.falseSplits}, failures=${strategy.failures.join(", ") || "none"}`,
  );

  const summary = [
    "Phase 18 baselines-and-ablations summary",
    `Observed corpus pairs: ${result.pairs.length}`,
    ...strategyLines,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
