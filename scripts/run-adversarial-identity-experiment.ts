import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateAdversarialIdentity } from "../benchmarks/adversarial-identity/evaluate.ts";

const outputPath = resolve(process.argv[2] ?? "results/raw/phase-6-adversarial-identity.json");
const baseUrl = pathToFileURL(resolve("benchmarks/adversarial-identity/index.html")).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const comparison = await evaluateAdversarialIdentity(page, baseUrl);

  const report = {
    schemaVersion: 1,
    experiment: "phase-6-adversarial-identity",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    comparison,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`Phase 6: v1=${comparison.v1.correct}/${comparison.v1.total}, v2=${comparison.v2.correct}/${comparison.v2.total} (false merges=${comparison.v2.falseMerges}), v3=${comparison.v3.correct}/${comparison.v3.total} (false merges=${comparison.v3.falseMerges})`);
  console.log(`Full result: ${outputPath}`);
} finally {
  await browser.close();
}
