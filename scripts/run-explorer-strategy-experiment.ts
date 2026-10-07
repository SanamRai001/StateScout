import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { compareExplorerStrategies } from "../benchmarks/explorer-strategy/evaluate.ts";

const outputPath = resolve(process.argv[2] ?? "results/raw/phase-5-explorer-strategy.json");
const startUrl = pathToFileURL(resolve("benchmarks/explorer-strategy/index.html")).href;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const comparison = await compareExplorerStrategies(page, startUrl);
  const report = {
    schemaVersion: 1,
    experiment: "phase-5-explorer-strategy",
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    generatedAt: new Date().toISOString(),
    comparison,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
  console.log(`Wrote ${outputPath}`);
} finally {
  await browser.close();
}
