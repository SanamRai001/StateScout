import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateBroaderGeneralization } from "../benchmarks/broader-generalization/evaluate.ts";
import { observeRealSites } from "../benchmarks/real-site-observation/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-8-broader-generalization.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const localFixtureUrl = pathToFileURL(
  resolve("benchmarks/broader-generalization/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const localPage = await browser.newPage();
  const localComparison = await evaluateBroaderGeneralization(
    localPage,
    localFixtureUrl,
  );
  await localPage.close();

  const realSitePage = await browser.newPage();
  const realSiteObservation = await observeRealSites(realSitePage, 3);
  await realSitePage.close();

  const report = {
    schemaVersion: 1,
    experiment: "phase-8-broader-generalization",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    localComparison,
    realSiteObservation,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const observedSites = realSiteObservation.filter(
    (target) => target.status === "observed",
  ).length;

  const lines = [
    "Phase 8 broader-generalization summary",
    `Local fixture v1: ${localComparison.v1.correct}/${localComparison.v1.total}, false merges=${localComparison.v1.falseMerges}, false splits=${localComparison.v1.falseSplits}`,
    `Local fixture v2: ${localComparison.v2.correct}/${localComparison.v2.total}, false merges=${localComparison.v2.falseMerges}, false splits=${localComparison.v2.falseSplits}`,
    `Local fixture v3: ${localComparison.v3.correct}/${localComparison.v3.total}, false merges=${localComparison.v3.falseMerges}, false splits=${localComparison.v3.falseSplits}`,
    `Real sites observed: ${observedSites}/${realSiteObservation.length}`,
    ...realSiteObservation.map((target) =>
      target.status === "observed"
        ? `  ${target.id}: unique hashes v1/v2/v3=${target.uniqueHashes.v1}/${target.uniqueHashes.v2}/${target.uniqueHashes.v3}`
        : `  ${target.id}: unavailable (${target.error ?? "unknown error"})`,
    ),
    "Real-site observations are informational and have no manual same/different ground-truth labels.",
    `Full JSON: ${outputPath}`,
  ];

  const summary = lines.join("\n") + "\n";
  await writeFile(summaryPath, summary, "utf8");

  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
