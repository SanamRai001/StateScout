import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateObservedVolatility } from "../benchmarks/observed-volatility/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-9-observed-volatility.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const baseUrl = pathToFileURL(
  resolve("benchmarks/observed-volatility/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const result = await evaluateObservedVolatility(page, baseUrl);

  const report = {
    schemaVersion: 1,
    experiment: "phase-9-observed-volatility",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    ...result,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const summary = [
    "Phase 9 observed-volatility summary",
    `Learned trusted scoped rules: ${result.profile.rules.length}`,
    `v1: ${result.v1.correct}/${result.v1.total}, false merges=${result.v1.falseMerges}, false splits=${result.v1.falseSplits}`,
    `v2: ${result.v2.correct}/${result.v2.total}, false merges=${result.v2.falseMerges}, false splits=${result.v2.falseSplits}`,
    `v3: ${result.v3.correct}/${result.v3.total}, false merges=${result.v3.falseMerges}, false splits=${result.v3.falseSplits}`,
    `v4: ${result.v4.correct}/${result.v4.total}, false merges=${result.v4.falseMerges}, false splits=${result.v4.falseSplits}`,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
