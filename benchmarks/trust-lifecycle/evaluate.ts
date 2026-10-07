import type { Page } from "playwright";
import { runEvolvedFutureCrawl } from "../profile-revalidation/evaluate.ts";
import {
  advanceTrustLifecycle,
  initializeTrustLifecycle,
  materializeActiveProfile,
  parseTrustLifecycleArtifact,
  serializeTrustLifecycleArtifact,
  type FrozenTrustLifecycleArtifact,
} from "../../src/core/volatilityTrustLifecycle.ts";
import {
  collectLifecycleWindow,
  createLifecycleParentProfile,
  lifecycleTimestamp,
  TRUST_LIFECYCLE_POLICY,
} from "./helpers.ts";
import { TRUST_LIFECYCLE_GROUND_TRUTH } from "./groundTruth.ts";

function activeCount(
  artifact: FrozenTrustLifecycleArtifact,
  day: number,
  hour = 14,
): number {
  return materializeActiveProfile(
    artifact,
    TRUST_LIFECYCLE_GROUND_TRUTH.applicationScope,
    lifecycleTimestamp(day, hour),
  ).profile.rules.length;
}

export async function evaluateTrustLifecycle(page: Page, startUrl: string) {
  const parentProfile = await createLifecycleParentProfile(page, startUrl);
  const initial = initializeTrustLifecycle(
    parentProfile,
    TRUST_LIFECYCLE_GROUND_TRUTH.applicationScope,
    lifecycleTimestamp(1),
    TRUST_LIFECYCLE_POLICY,
  );

  const stableRetain = advanceTrustLifecycle(
    initial,
    await collectLifecycleWindow(page, startUrl, "stable", [5, 6, 7, 8], "stable-retain", lifecycleTimestamp(2)),
    lifecycleTimestamp(2, 13),
  );

  const transientWindow = await collectLifecycleWindow(
    page, startUrl, "evolved", [5, 6, 7, 8], "transient-conflict", lifecycleTimestamp(3),
  );
  const transientChallenge = advanceTrustLifecycle(
    stableRetain,
    transientWindow,
    lifecycleTimestamp(3, 13),
  );
  const duplicateChallenge = advanceTrustLifecycle(
    transientChallenge,
    transientWindow,
    lifecycleTimestamp(3, 14),
  );

  const challengeCleared = advanceTrustLifecycle(
    duplicateChallenge,
    await collectLifecycleWindow(page, startUrl, "stable", [9, 10, 11, 12], "challenge-clear", lifecycleTimestamp(4)),
    lifecycleTimestamp(4, 13),
  );

  const persistentConflictFirst = advanceTrustLifecycle(
    challengeCleared,
    await collectLifecycleWindow(page, startUrl, "evolved", [9, 10, 11, 12], "persistent-conflict-a", lifecycleTimestamp(5)),
    lifecycleTimestamp(5, 13),
  );
  const persistentConflictSecond = advanceTrustLifecycle(
    persistentConflictFirst,
    await collectLifecycleWindow(page, startUrl, "evolved", [13, 14, 15, 16], "persistent-conflict-b", lifecycleTimestamp(6)),
    lifecycleTimestamp(6, 13),
  );

  const recoveryFirst = advanceTrustLifecycle(
    persistentConflictSecond,
    await collectLifecycleWindow(page, startUrl, "stable", [13, 14, 15, 16], "recovery-a", lifecycleTimestamp(7)),
    lifecycleTimestamp(7, 13),
  );
  const recoverySecond = advanceTrustLifecycle(
    recoveryFirst,
    await collectLifecycleWindow(page, startUrl, "stable", [17, 18, 19, 20], "recovery-b", lifecycleTimestamp(8)),
    lifecycleTimestamp(8, 13),
  );

  const staleEvidenceArtifact = advanceTrustLifecycle(
    recoverySecond,
    await collectLifecycleWindow(page, startUrl, "stable", [21, 22, 23, 24], "stale-window", lifecycleTimestamp(8)),
    lifecycleTimestamp(10, 13),
  );
  const scopeMismatchArtifact = advanceTrustLifecycle(
    recoverySecond,
    await collectLifecycleWindow(
      page, startUrl, "stable", [25, 26, 27, 28], "scope-v2", lifecycleTimestamp(9), "statescout-fixture:v2",
    ),
    lifecycleTimestamp(9, 13),
  );

  const staleTrust = materializeActiveProfile(
    recoverySecond,
    TRUST_LIFECYCLE_GROUND_TRUTH.applicationScope,
    lifecycleTimestamp(20),
  );
  const scopeMismatch = materializeActiveProfile(
    recoverySecond,
    "statescout-fixture:v2",
    lifecycleTimestamp(8, 14),
  );

  const challengedProfile = materializeActiveProfile(
    transientChallenge,
    TRUST_LIFECYCLE_GROUND_TRUTH.applicationScope,
    lifecycleTimestamp(3, 14),
  );
  const challengedEvolvedRun = await runEvolvedFutureCrawl(
    page,
    startUrl,
    challengedProfile.profile,
  );

  const serialized = serializeTrustLifecycleArtifact(recoverySecond);
  const parsed = parseTrustLifecycleArtifact(serialized);

  return {
    states: {
      stableRetain: stableRetain.entries[0]?.state,
      transientChallenge: transientChallenge.entries[0]?.state,
      duplicateChallenge: duplicateChallenge.entries[0]?.state,
      challengeCleared: challengeCleared.entries[0]?.state,
      persistentConflictFirst: persistentConflictFirst.entries[0]?.state,
      persistentConflictSecond: persistentConflictSecond.entries[0]?.state,
      recoveryFirst: recoveryFirst.entries[0]?.state,
      recoverySecond: recoverySecond.entries[0]?.state,
    },
    activeRules: {
      stableRetain: activeCount(stableRetain, 2),
      transientChallenge: activeCount(transientChallenge, 3),
      duplicateChallenge: activeCount(duplicateChallenge, 3, 15),
      challengeCleared: activeCount(challengeCleared, 4),
      persistentConflictFirst: activeCount(persistentConflictFirst, 5),
      persistentConflictSecond: activeCount(persistentConflictSecond, 6),
      recoveryFirst: activeCount(recoveryFirst, 7),
      recoverySecond: activeCount(recoverySecond, 8),
    },
    duplicateWindowStatus: duplicateChallenge.decisions[0]?.status,
    staleEvidenceStatus: staleEvidenceArtifact.decisions[0]?.status,
    scopeMismatchStatus: scopeMismatchArtifact.decisions[0]?.status,
    staleTrust,
    scopeMismatch,
    roundTripStable: serializeTrustLifecycleArtifact(parsed) === serialized,
    challengedEvolvedRun,
    finalArtifact: recoverySecond,
  };
}
