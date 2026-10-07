import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateExplorerEvidenceStore } from "../benchmarks/explorer-evidence-store/evaluate.ts";
import {
  discoverQuarantinedCandidates,
  mergeVolatilityEvidenceStores,
  parseVolatilityEvidenceStore,
  serializeVolatilityEvidenceStore,
} from "../src/core/volatilityEvidenceStore.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-11-explorer-evidence-store.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const sessionAPath = outputPath.replace(/\.json$/i, "-session-a-evidence.json");
const sessionBPath = outputPath.replace(/\.json$/i, "-session-b-evidence.json");
const mergedEvidencePath = outputPath.replace(/\.json$/i, "-merged-evidence.json");
const startUrl = pathToFileURL(
  resolve("benchmarks/explorer-evidence-store/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const result = await evaluateExplorerEvidenceStore(page, startUrl);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    sessionAPath,
    serializeVolatilityEvidenceStore(result.evidenceStores.sessionA),
    "utf8",
  );
  await writeFile(
    sessionBPath,
    serializeVolatilityEvidenceStore(result.evidenceStores.sessionB),
    "utf8",
  );

  const persistedA = parseVolatilityEvidenceStore(
    await readFile(sessionAPath, "utf8"),
  );
  const persistedB = parseVolatilityEvidenceStore(
    await readFile(sessionBPath, "utf8"),
  );
  const persistedMerged = mergeVolatilityEvidenceStores(
    persistedA,
    persistedB,
  );
  await writeFile(
    mergedEvidencePath,
    serializeVolatilityEvidenceStore(persistedMerged),
    "utf8",
  );

  const persistedCandidates =
    discoverQuarantinedCandidates(persistedMerged);

  const report = {
    schemaVersion: 1,
    experiment: "phase-11-explorer-evidence-store",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    identityInvariant: result.identityInvariant,
    graph: result.graph,
    evidenceErrors: result.evidenceErrors,
    stores: result.stores,
    candidates: persistedCandidates,
    persistence: {
      sessionAPath,
      sessionBPath,
      mergedEvidencePath,
      mergedRecordCount: persistedMerged.records.length,
    },
  };

  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const candidate = persistedCandidates[0];
  const summary = [
    "Phase 11 explorer-evidence-store summary",
    `Identity unchanged with session A collector: ${result.identityInvariant.baselineEqualsSessionA}`,
    `Identity unchanged with session B collector: ${result.identityInvariant.baselineEqualsSessionB}`,
    `Graph states/transitions/attempts: ${result.graph.states}/${result.graph.transitions}/${result.graph.attemptedTransitions}`,
    `Evidence errors baseline/A/B: ${result.evidenceErrors.baseline}/${result.evidenceErrors.sessionA}/${result.evidenceErrors.sessionB}`,
    `Session A evidence records: ${result.stores.sessionA.records}`,
    `Session B evidence records: ${result.stores.sessionB.records}`,
    `Merged evidence records: ${persistedMerged.records.length}`,
    `Persistence round-trip stable: ${result.stores.roundTripStable}`,
    `Idempotent merge stable: ${result.stores.idempotentMergeStable}`,
    `Quarantined candidates: ${persistedCandidates.length}`,
    `Candidate field/sessions/distinct values: ${candidate?.field ?? "none"}/${candidate?.sessionIds.length ?? 0}/${candidate?.distinctValues.length ?? 0}`,
    `Full JSON: ${outputPath}`,
    `Merged evidence: ${mergedEvidencePath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
