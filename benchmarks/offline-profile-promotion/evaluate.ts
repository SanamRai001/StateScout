import type { Page } from "playwright";

import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import {
  buildOfflineVolatilityProfile,
  parseFrozenVolatilityProfile,
  serializeFrozenVolatilityProfile,
  type FrozenVolatilityProfileArtifact,
} from "../../src/core/offlineVolatilityPromotion.ts";
import {
  createVolatilityProfile,
  volatilityAnchorHash,
  type VolatilityProfile,
} from "../../src/core/volatility.ts";
import {
  createVolatilityBehaviorEvidenceStore,
  type VolatilityBehaviorEvidenceStore,
} from "../../src/core/volatilityBehaviorEvidenceStore.ts";
import {
  VolatilityEvidenceCollector,
  discoverQuarantinedCandidates,
  mergeVolatilityEvidenceStores,
  type VolatilityEvidenceStore,
} from "../../src/core/volatilityEvidenceStore.ts";
import {
  volatilityFieldValue,
  type CandidateBehaviorEvidence,
} from "../../src/core/volatilityCandidates.ts";
import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { OFFLINE_PROMOTION_GROUND_TRUTH } from "./groundTruth.ts";

export async function collectObservationEvidence(
  page: Page,
  startUrl: string,
  sessionId: string,
): Promise<VolatilityEvidenceStore> {
  const collector = new VolatilityEvidenceCollector(sessionId);
  const fingerprinter = createFingerprintStateV4(createVolatilityProfile([]));

  await exploreWithPlaywright(page, {
    startUrl,
    maxTransitions: OFFLINE_PROMOTION_GROUND_TRUTH.evidenceRunMaxTransitions,
    fingerprinter,
    observationSink: ({ snapshot }) => {
      collector.observe(snapshot);
    },
  });

  return collector.toStore();
}

export async function collectBehaviorEvidence(
  page: Page,
  startUrl: string,
): Promise<VolatilityBehaviorEvidenceStore> {
  const records: CandidateBehaviorEvidence[] = [];

  for (const seed of [1, 2, 3, 4]) {
    const sessionId = seed <= 2 ? "behavior-session-a" : "behavior-session-b";

    await page.goto(`${startUrl}#seed-${seed}`);
    await page.reload();

    const before = await observePage(page);
    await page.getByRole("button", { name: "Inspect dashboard" }).click();
    const after = await observePage(page);

    records.push({
      sessionId,
      sourceAnchorHash: volatilityAnchorHash(before, "title"),
      fieldValue: volatilityFieldValue(before, "title"),
      behaviorSignature: fingerprintState(after).hash,
    });
  }

  return createVolatilityBehaviorEvidenceStore(records);
}

export async function runFutureCrawl(
  page: Page,
  startUrl: string,
  profile: VolatilityProfile,
) {
  const result = await exploreWithPlaywright(page, {
    startUrl,
    maxTransitions: OFFLINE_PROMOTION_GROUND_TRUTH.evidenceRunMaxTransitions,
    fingerprinter: createFingerprintStateV4(profile),
  });

  return {
    states: result.graph.stateCount,
    transitions: result.graph.transitionCount,
    attempts: result.attemptedTransitions,
    failedTransitions: result.graph
      .listTransitions()
      .filter((transition) => transition.status === "failed").length,
    evidenceErrors: result.evidenceErrors.length,
  };
}

export async function evaluateOfflineProfilePromotion(
  page: Page,
  startUrl: string,
) {
  const sessionA = await collectObservationEvidence(
    page,
    startUrl,
    "phase12-crawl-a",
  );
  const sessionB = await collectObservationEvidence(
    page,
    startUrl,
    "phase12-crawl-b",
  );

  const mergedObservationEvidence = mergeVolatilityEvidenceStores(
    sessionA,
    sessionB,
  );
  const candidates = discoverQuarantinedCandidates(
    mergedObservationEvidence,
  );
  const behaviorEvidence = await collectBehaviorEvidence(page, startUrl);

  const artifact = buildOfflineVolatilityProfile(
    mergedObservationEvidence,
    behaviorEvidence,
  );
  const serializedArtifact = serializeFrozenVolatilityProfile(artifact);
  const parsedArtifact = parseFrozenVolatilityProfile(serializedArtifact);

  const emptyProfileRun = await runFutureCrawl(
    page,
    startUrl,
    createVolatilityProfile([]),
  );
  const promotedProfileRun = await runFutureCrawl(
    page,
    startUrl,
    parsedArtifact.profile,
  );

  return {
    sessionA,
    sessionB,
    mergedObservationEvidence,
    candidates,
    behaviorEvidence,
    artifact,
    artifactRoundTripStable:
      serializeFrozenVolatilityProfile(parsedArtifact) === serializedArtifact,
    emptyProfileRun,
    promotedProfileRun,
  };
}

export async function runFutureCrawlFromArtifact(
  page: Page,
  startUrl: string,
  artifact: FrozenVolatilityProfileArtifact,
) {
  return runFutureCrawl(page, startUrl, artifact.profile);
}
