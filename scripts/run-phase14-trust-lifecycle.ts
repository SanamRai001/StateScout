import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { evaluateTrustLifecycle } from "../benchmarks/trust-lifecycle/evaluate.ts";
import { serializeTrustLifecycleArtifact } from "../src/core/volatilityTrustLifecycle.ts";

const outputPath = resolve(process.argv[2] ?? "results/raw/phase-14-trust-lifecycle.json");
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const artifactPath = outputPath.replace(/\.json$/i, "-final-artifact.json");
const startUrl = pathToFileURL(resolve("benchmarks/profile-revalidation/index.html")).href;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const result = await evaluateTrustLifecycle(page, startUrl);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(artifactPath, serializeTrustLifecycleArtifact(result.finalArtifact), "utf8");

  const report = {
    schemaVersion: 1,
    experiment: "phase-14-trust-lifecycle",
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    generatedAt: new Date().toISOString(),
    states: result.states,
    activeRules: result.activeRules,
    duplicateWindowStatus: result.duplicateWindowStatus,
    staleEvidenceStatus: result.staleEvidenceStatus,
    scopeMismatchStatus: result.scopeMismatchStatus,
    staleTrustInactiveReasons: result.staleTrust.inactive.map((item) => item.reason),
    scopeMismatchInactiveReasons: result.scopeMismatch.inactive.map((item) => item.reason),
    roundTripStable: result.roundTripStable,
    challengedEvolvedRun: result.challengedEvolvedRun,
    finalArtifactPath: artifactPath,
  };
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const summary = [
    "Phase 14 trust-lifecycle summary",
    `Stable retain state/active rules: ${result.states.stableRetain}/${result.activeRules.stableRetain}`,
    `Transient challenge state/active rules: ${result.states.transientChallenge}/${result.activeRules.transientChallenge}`,
    `Duplicate challenge status/state: ${result.duplicateWindowStatus}/${result.states.duplicateChallenge}`,
    `Challenge cleared state/active rules: ${result.states.challengeCleared}/${result.activeRules.challengeCleared}`,
    `Persistent conflict states: ${result.states.persistentConflictFirst}->${result.states.persistentConflictSecond}`,
    `Recovery states: ${result.states.recoveryFirst}->${result.states.recoverySecond}`,
    `Stale evidence status: ${result.staleEvidenceStatus}`,
    `Scope mismatch evidence status: ${result.scopeMismatchStatus}`,
    `Expired trust active rules: ${result.staleTrust.profile.rules.length}`,
    `Wrong-scope active rules: ${result.scopeMismatch.profile.rules.length}`,
    `Lifecycle round-trip stable: ${result.roundTripStable}`,
    `Challenged evolved run coverage/states/transitions/attempts: ${result.challengedEvolvedRun.meaningfulDetailsCoverage}/${result.challengedEvolvedRun.states}/${result.challengedEvolvedRun.transitions}/${result.challengedEvolvedRun.attempts}`,
    `Challenged evolved run failed transitions: ${result.challengedEvolvedRun.failedTransitions}`,
    `Full JSON: ${outputPath}`,
    `Final lifecycle artifact: ${artifactPath}`,
  ].join("\n") + "\n";
  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
