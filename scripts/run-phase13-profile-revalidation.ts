import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import {
  evaluateProfileRevalidation,
  runEvolvedFutureCrawl,
} from "../benchmarks/profile-revalidation/evaluate.ts";
import {
  parseFrozenVolatilityProfile,
  serializeFrozenVolatilityProfile,
} from "../src/core/offlineVolatilityPromotion.ts";
import {
  parseFrozenVolatilityProfileRevision,
  serializeFrozenVolatilityProfileRevision,
} from "../src/core/offlineVolatilityRevalidation.ts";
import {
  serializeRuleRevalidationEvidenceStore,
} from "../src/core/volatilityRevalidationEvidenceStore.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-13-profile-revalidation.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const parentProfilePath = outputPath.replace(/\.json$/i, "-parent-profile.json");
const stableEvidencePath = outputPath.replace(/\.json$/i, "-stable-evidence.json");
const evolvedEvidencePath = outputPath.replace(/\.json$/i, "-evolved-evidence.json");
const stableRevisionPath = outputPath.replace(/\.json$/i, "-stable-revision.json");
const evolvedRevisionPath = outputPath.replace(/\.json$/i, "-evolved-revision.json");

const startUrl = pathToFileURL(
  resolve("benchmarks/profile-revalidation/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const evaluationPage = await browser.newPage();
  const result = await evaluateProfileRevalidation(
    evaluationPage,
    startUrl,
  );
  await evaluationPage.close();

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    parentProfilePath,
    serializeFrozenVolatilityProfile(result.parentProfile),
    "utf8",
  );
  await writeFile(
    stableEvidencePath,
    serializeRuleRevalidationEvidenceStore(result.stableEvidence),
    "utf8",
  );
  await writeFile(
    evolvedEvidencePath,
    serializeRuleRevalidationEvidenceStore(result.evolvedEvidence),
    "utf8",
  );
  await writeFile(
    stableRevisionPath,
    serializeFrozenVolatilityProfileRevision(result.stableRevision),
    "utf8",
  );
  await writeFile(
    evolvedRevisionPath,
    serializeFrozenVolatilityProfileRevision(result.evolvedRevision),
    "utf8",
  );

  const persistedParent = parseFrozenVolatilityProfile(
    await readFile(parentProfilePath, "utf8"),
  );
  const persistedStableRevision = parseFrozenVolatilityProfileRevision(
    await readFile(stableRevisionPath, "utf8"),
  );
  const persistedEvolvedRevision = parseFrozenVolatilityProfileRevision(
    await readFile(evolvedRevisionPath, "utf8"),
  );

  const stalePage = await browser.newPage();
  const persistedStaleFutureRun = await runEvolvedFutureCrawl(
    stalePage,
    startUrl,
    persistedParent.profile,
  );
  await stalePage.close();

  const revokedPage = await browser.newPage();
  const persistedRevokedFutureRun = await runEvolvedFutureCrawl(
    revokedPage,
    startUrl,
    persistedEvolvedRevision.profile,
  );
  await revokedPage.close();

  const stableDecision = persistedStableRevision.decisions[0];
  const evolvedDecision = persistedEvolvedRevision.decisions[0];

  const report = {
    schemaVersion: 1,
    experiment: "phase-13-profile-revalidation",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    parentProfile: {
      rules: persistedParent.profile.rules.length,
    },
    stableRevalidation: {
      decision: stableDecision,
      resultingRules: persistedStableRevision.profile.rules.length,
      parentProfileSha256: persistedStableRevision.parentProfileSha256,
      challengeEvidenceSha256: persistedStableRevision.challengeEvidenceSha256,
      roundTripStable: result.stableRevisionRoundTripStable,
    },
    evolvedRevalidation: {
      decision: evolvedDecision,
      resultingRules: persistedEvolvedRevision.profile.rules.length,
      parentProfileSha256: persistedEvolvedRevision.parentProfileSha256,
      challengeEvidenceSha256: persistedEvolvedRevision.challengeEvidenceSha256,
      roundTripStable: result.evolvedRevisionRoundTripStable,
    },
    staleProfileFutureRun: persistedStaleFutureRun,
    revokedProfileFutureRun: persistedRevokedFutureRun,
    artifacts: {
      parentProfilePath,
      stableEvidencePath,
      evolvedEvidencePath,
      stableRevisionPath,
      evolvedRevisionPath,
    },
  };

  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const summary = [
    "Phase 13 profile-revalidation summary",
    `Parent trusted rules: ${persistedParent.profile.rules.length}`,
    `Stable revalidation status/signatures/resulting rules: ${stableDecision?.status ?? "none"}/${stableDecision?.behaviorSignatureCount ?? 0}/${persistedStableRevision.profile.rules.length}`,
    `Evolved revalidation status/signatures/resulting rules: ${evolvedDecision?.status ?? "none"}/${evolvedDecision?.behaviorSignatureCount ?? 0}/${persistedEvolvedRevision.profile.rules.length}`,
    `Stable revision round-trip stable: ${result.stableRevisionRoundTripStable}`,
    `Evolved revision round-trip stable: ${result.evolvedRevisionRoundTripStable}`,
    `Parent profile digest present: ${persistedEvolvedRevision.parentProfileSha256.length === 64}`,
    `Challenge evidence digest present: ${persistedEvolvedRevision.challengeEvidenceSha256.length === 64}`,
    `Evolved run with stale profile coverage/states/transitions/attempts: ${persistedStaleFutureRun.meaningfulDetailsCoverage}/${persistedStaleFutureRun.states}/${persistedStaleFutureRun.transitions}/${persistedStaleFutureRun.attempts}`,
    `Evolved run after revocation coverage/states/transitions/attempts: ${persistedRevokedFutureRun.meaningfulDetailsCoverage}/${persistedRevokedFutureRun.states}/${persistedRevokedFutureRun.transitions}/${persistedRevokedFutureRun.attempts}`,
    `Evolved run after revocation failed transitions: ${persistedRevokedFutureRun.failedTransitions}`,
    `Full JSON: ${outputPath}`,
    `Revoked revision: ${evolvedRevisionPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
