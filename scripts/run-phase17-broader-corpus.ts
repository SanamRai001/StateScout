import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluatePhase17Corpus } from "../benchmarks/corpus-v1/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-17-broader-corpus.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const fixtureRootUrl = pathToFileURL(
  resolve("benchmarks/corpus-v1") + sep,
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const result = await evaluatePhase17Corpus(page, fixtureRootUrl);

  const report = {
    schemaVersion: 1,
    experiment: "phase-17-broader-corpus",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    metrics: result,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const failures = result.cases
    .filter((candidate) => !candidate.correct)
    .map((candidate) => candidate.id)
    .join(", ");

  const familyLines = result.families.map(
    (family) =>
      `${family.family}: ${family.correct}/${family.total}, FM=${family.falseMerges}, FS=${family.falseSplits}`,
  );

  const summary = [
    "Phase 17 broader-corpus summary",
    `Cases/families: ${result.total}/${result.families.length}`,
    `Correct/accuracy: ${result.correct}/${result.accuracy}`,
    `False merges: ${result.falseMerges}`,
    `False splits: ${result.falseSplits}`,
    `Failures: ${failures || "none"}`,
    "Family metrics:",
    ...familyLines,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
