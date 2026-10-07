import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { compareFingerprints } from "../benchmarks/state-equivalence/compare.ts";

const outputPath = resolve(process.argv[2] ?? "results/raw/phase-3-fingerprint-comparison.json");
const comparison = compareFingerprints();
const report = {
  schemaVersion: 1,
  experiment: "phase-3-fingerprint-v1-v2-comparison",
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  generatedAt: new Date().toISOString(),
  comparison,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outputPath}`);
