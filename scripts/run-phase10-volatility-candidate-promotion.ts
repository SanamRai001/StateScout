import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateCandidatePromotion } from "../benchmarks/volatility-candidate-promotion/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-10-volatility-candidate-promotion.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const baseUrl = pathToFileURL(
  resolve("benchmarks/volatility-candidate-promotion/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const result = await evaluateCandidatePromotion(page, baseUrl);

  const report = {
    schemaVersion: 1,
    experiment: "phase-10-volatility-candidate-promotion",
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
    "Phase 10 volatility-candidate-promotion summary",
    `Dashboard candidate eligible: ${result.dashboardCandidate.assessment.eligible}`,
    `Dashboard behavior signatures: ${result.dashboardCandidate.assessment.behaviorSignatureCount}`,
    `Auction candidate eligible: ${result.auctionCandidate.assessment.eligible}`,
    `Auction behavior signatures: ${result.auctionCandidate.assessment.behaviorSignatureCount}`,
    `Promoted trusted rules: ${result.promotedProfile.rules.length}`,
    `v3: ${result.v3.correct}/${result.v3.total}, false merges=${result.v3.falseMerges}, false splits=${result.v3.falseSplits}`,
    `v4 without profile: ${result.v4WithoutProfile.correct}/${result.v4WithoutProfile.total}, false merges=${result.v4WithoutProfile.falseMerges}, false splits=${result.v4WithoutProfile.falseSplits}`,
    `v4 promoted profile: ${result.v4WithPromotedProfile.correct}/${result.v4WithPromotedProfile.total}, false merges=${result.v4WithPromotedProfile.falseMerges}, false splits=${result.v4WithPromotedProfile.falseSplits}`,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
