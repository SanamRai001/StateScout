import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { evaluateReversibleEquivalence } from "../benchmarks/reversible-equivalence/evaluate.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-16-reversible-equivalence.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");

const result = evaluateReversibleEquivalence();

const report = {
  schemaVersion: 1,
  experiment: "phase-16-reversible-equivalence",
  runtime: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  generatedAt: new Date().toISOString(),
  raw: result.raw,
  trustedProjection: result.trustedProjection,
  revokedProjection: result.revokedProjection,
  restoredProjection: result.restoredProjection,
  rawArchiveDigestStable: result.rawArchiveDigestStable,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const summary = [
  "Phase 16 reversible-equivalence summary",
  `Raw observations/transitions: ${result.raw.observations}/${result.raw.transitions}`,
  `Raw archive round-trip stable: ${result.raw.roundTripStable}`,
  `Trusted projection states/transitions: ${result.trustedProjection.states}/${result.trustedProjection.transitions}`,
  `Trusted Dashboard alias members: ${result.trustedProjection.dashboardMembers}`,
  `Merged projected edge raw transition ids: ${result.trustedProjection.mergedTransitionRawIds.join(", ")}`,
  `Revoked projection states/transitions: ${result.revokedProjection.states}/${result.revokedProjection.transitions}`,
  `Revoked Dashboard states recovered: ${result.revokedProjection.dashboardStates}`,
  `Restored projection states/transitions: ${result.restoredProjection.states}/${result.restoredProjection.transitions}`,
  `Raw archive digest unchanged across reprojection: ${result.rawArchiveDigestStable}`,
  `Full JSON: ${outputPath}`,
].join("\n") + "\n";

await writeFile(summaryPath, summary, "utf8");
console.log(summary.trim());
console.log(`Summary file: ${summaryPath}`);
