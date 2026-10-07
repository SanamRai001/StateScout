import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import {
  evaluateOfflineProfilePromotion,
  runFutureCrawlFromArtifact,
} from "../benchmarks/offline-profile-promotion/evaluate.ts";
import {
  parseFrozenVolatilityProfile,
  serializeFrozenVolatilityProfile,
} from "../src/core/offlineVolatilityPromotion.ts";
import {
  serializeVolatilityBehaviorEvidenceStore,
} from "../src/core/volatilityBehaviorEvidenceStore.ts";
import {
  serializeVolatilityEvidenceStore,
} from "../src/core/volatilityEvidenceStore.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-12-offline-profile-promotion.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const observationAPath = outputPath.replace(/\.json$/i, "-crawl-a-evidence.json");
const observationBPath = outputPath.replace(/\.json$/i, "-crawl-b-evidence.json");
const mergedObservationPath = outputPath.replace(/\.json$/i, "-merged-observation-evidence.json");
const behaviorPath = outputPath.replace(/\.json$/i, "-behavior-evidence.json");
const profilePath = outputPath.replace(/\.json$/i, "-frozen-profile.json");

const startUrl = pathToFileURL(
  resolve("benchmarks/offline-profile-promotion/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const evaluationPage = await browser.newPage();
  const result = await evaluateOfflineProfilePromotion(
    evaluationPage,
    startUrl,
  );
  await evaluationPage.close();

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    observationAPath,
    serializeVolatilityEvidenceStore(result.sessionA),
    "utf8",
  );
  await writeFile(
    observationBPath,
    serializeVolatilityEvidenceStore(result.sessionB),
    "utf8",
  );
  await writeFile(
    mergedObservationPath,
    serializeVolatilityEvidenceStore(result.mergedObservationEvidence),
    "utf8",
  );
  await writeFile(
    behaviorPath,
    serializeVolatilityBehaviorEvidenceStore(result.behaviorEvidence),
    "utf8",
  );
  await writeFile(
    profilePath,
    serializeFrozenVolatilityProfile(result.artifact),
    "utf8",
  );

  const persistedArtifact = parseFrozenVolatilityProfile(
    await readFile(profilePath, "utf8"),
  );

  const futurePage = await browser.newPage();
  const persistedFutureRun = await runFutureCrawlFromArtifact(
    futurePage,
    startUrl,
    persistedArtifact,
  );
  await futurePage.close();

  const report = {
    schemaVersion: 1,
    experiment: "phase-12-offline-profile-promotion",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    candidateCount: result.candidates.length,
    candidates: result.candidates,
    behaviorEvidenceRecords: result.behaviorEvidence.records.length,
    decisions: result.artifact.decisions,
    frozenProfile: {
      rules: result.artifact.profile.rules,
      observationEvidenceSha256: result.artifact.observationEvidenceSha256,
      behaviorEvidenceSha256: result.artifact.behaviorEvidenceSha256,
      roundTripStable: result.artifactRoundTripStable,
    },
    emptyProfileFutureRun: result.emptyProfileRun,
    inMemoryPromotedFutureRun: result.promotedProfileRun,
    persistedProfileFutureRun: persistedFutureRun,
    artifacts: {
      observationAPath,
      observationBPath,
      mergedObservationPath,
      behaviorPath,
      profilePath,
    },
  };

  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const candidate = result.candidates[0];
  const decision = result.artifact.decisions[0];
  const summary = [
    "Phase 12 offline-profile-promotion summary",
    `Quarantined candidates: ${result.candidates.length}`,
    `Candidate field/sessions/distinct values: ${candidate?.field ?? "none"}/${candidate?.sessionIds.length ?? 0}/${candidate?.distinctValues.length ?? 0}`,
    `Behavior evidence records: ${result.behaviorEvidence.records.length}`,
    `Promotion decision: ${decision?.promoted ?? false}`,
    `Promoted trusted rules: ${result.artifact.profile.rules.length}`,
    `Frozen profile round-trip stable: ${result.artifactRoundTripStable}`,
    `Observation evidence digest present: ${result.artifact.observationEvidenceSha256.length === 64}`,
    `Behavior evidence digest present: ${result.artifact.behaviorEvidenceSha256.length === 64}`,
    `Future run without profile states/transitions/attempts: ${result.emptyProfileRun.states}/${result.emptyProfileRun.transitions}/${result.emptyProfileRun.attempts}`,
    `Future run from persisted profile states/transitions/attempts: ${persistedFutureRun.states}/${persistedFutureRun.transitions}/${persistedFutureRun.attempts}`,
    `Future run from persisted profile failed transitions: ${persistedFutureRun.failedTransitions}`,
    `Full JSON: ${outputPath}`,
    `Frozen profile: ${profilePath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
