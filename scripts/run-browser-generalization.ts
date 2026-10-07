import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateBrowserGeneralization } from "../benchmarks/browser-generalization/evaluate.ts";

const outputPath = resolve(process.argv[2] ?? "results/raw/phase-4-browser-generalization.json");
const baseUrl = pathToFileURL(resolve("benchmarks/browser-generalization/index.html")).href;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const comparison = await evaluateBrowserGeneralization(page, baseUrl);
  const report = {
    schemaVersion: 1,
    experiment: "phase-4-browser-generalization",
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    generatedAt: new Date().toISOString(),
    comparison,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`Phase 4: v1=${comparison.v1.correct}/${comparison.v1.total}, v2=${comparison.v2.correct}/${comparison.v2.total}, v3=${comparison.v3.correct}/${comparison.v3.total}`);
  console.log(`Full result: ${outputPath}`);
} finally {
  await browser.close();
}
