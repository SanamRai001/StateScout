import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { STATE_EQUIVALENCE_CASES } from "../benchmarks/state-equivalence/cases.ts";
import { evaluateEquivalence } from "../benchmarks/state-equivalence/evaluate.ts";

const outputArg = process.argv[2] ?? "results/raw/phase-2-state-equivalence.json";
const outputPath = resolve(outputArg);
const metrics = evaluateEquivalence(STATE_EQUIVALENCE_CASES);
const report = {
  schemaVersion: 1,
  experiment: "phase-2-state-equivalence",
  fingerprint: { algorithm: "statescout-semantic", version: 1 },
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  generatedAt: new Date().toISOString(),
  metrics,
};

await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outputPath}`);
