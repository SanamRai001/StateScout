import type { Page } from "playwright";

import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import {
  buildOfflineVolatilityProfile,
  type FrozenVolatilityProfileArtifact,
} from "../../src/core/offlineVolatilityPromotion.ts";
import {
  buildRevalidatedVolatilityProfile,
  parseFrozenVolatilityProfileRevision,
  serializeFrozenVolatilityProfileRevision,
  type FrozenVolatilityProfileRevisionArtifact,
} from "../../src/core/offlineVolatilityRevalidation.ts";
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
  createRuleRevalidationEvidenceStore,
  type RuleRevalidationEvidenceStore,
  type RuleRevalidationEvidenceRecord,
} from "../../src/core/volatilityRevalidationEvidenceStore.ts";
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
import { PROFILE_REVALIDATION_GROUND_TRUTH } from "./groundTruth.ts";

const EXPECTED_EVOLVED_HEADINGS = new Set([
  "Dashboard standard details",
  "Dashboard priority details",
]);

async function collectObservationEvidence(
  page: Page,
  startUrl: string,
  sessionId: string,
): Promise<VolatilityEvidenceStore> {
  const collector = new VolatilityEvidenceCollector(sessionId);

  await exploreWithPlaywright(page, {
    startUrl: `${startUrl}#baseline-1`,
    maxTransitions: 6,
    fingerprinter: createFingerprintStateV4(createVolatilityProfile([])),
    observationSink: ({ snapshot }) => {
      collector.observe(snapshot);
    },
  });

  return collector.toStore();
}

async function collectPromotionBehaviorEvidence(
  page: Page,
  startUrl: string,
): Promise<VolatilityBehaviorEvidenceStore> {
  const records: CandidateBehaviorEvidence[] = [];

  for (const seed of [1, 2, 3, 4]) {
    const sessionId =
      seed <= 2 ? "promotion-behavior-a" : "promotion-behavior-b";

    await page.goto(`${startUrl}#baseline-${seed}`);
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

async function collectRevalidationEvidence(
  page: Page,
  startUrl: string,
  mode: "stable" | "evolved",
): Promise<RuleRevalidationEvidenceStore> {
  const records: RuleRevalidationEvidenceRecord[] = [];

  for (const seed of [5, 6, 7, 8]) {
    const sessionId =
      seed <= 6
        ? `${mode}-revalidation-a`
        : `${mode}-revalidation-b`;

    await page.goto(`${startUrl}#${mode}-${seed}`);
    await page.reload();

    const before = await observePage(page);
    await page.getByRole("button", { name: "Inspect dashboard" }).click();
    const after = await observePage(page);

    records.push({
      sessionId,
      field: "title",
      sourceAnchorHash: volatilityAnchorHash(before, "title"),
      fieldValue: volatilityFieldValue(before, "title"),
      behaviorSignature: fingerprintState(after).hash,
    });
  }

  return createRuleRevalidationEvidenceStore(records);
}

export async function runEvolvedFutureCrawl(
  page: Page,
  startUrl: string,
  profile: VolatilityProfile,
) {
  const result = await exploreWithPlaywright(page, {
    startUrl: `${startUrl}#evolved-1`,
    maxTransitions: 6,
    fingerprinter: createFingerprintStateV4(profile),
  });

  const observedDetails = new Set(
    result.graph
      .listStates()
      .flatMap((state) => state.snapshot.headings)
      .filter((heading) => EXPECTED_EVOLVED_HEADINGS.has(heading)),
  );

  return {
    meaningfulDetailsCoverage:
      observedDetails.size / EXPECTED_EVOLVED_HEADINGS.size,
    observedDetails: [...observedDetails].sort(),
    states: result.graph.stateCount,
    transitions: result.graph.transitionCount,
    attempts: result.attemptedTransitions,
    failedTransitions: result.graph
      .listTransitions()
      .filter((transition) => transition.status === "failed").length,
    evidenceErrors: result.evidenceErrors.length,
  };
}

export async function evaluateProfileRevalidation(
  page: Page,
  startUrl: string,
) {
  const observationA = await collectObservationEvidence(
    page,
    startUrl,
    "phase13-observation-a",
  );
  const observationB = await collectObservationEvidence(
    page,
    startUrl,
    "phase13-observation-b",
  );
  const mergedObservationEvidence = mergeVolatilityEvidenceStores(
    observationA,
    observationB,
  );
  const candidates = discoverQuarantinedCandidates(
    mergedObservationEvidence,
  );
  const promotionBehaviorEvidence =
    await collectPromotionBehaviorEvidence(page, startUrl);
  const parentProfile = buildOfflineVolatilityProfile(
    mergedObservationEvidence,
    promotionBehaviorEvidence,
  );

  const stableEvidence = await collectRevalidationEvidence(
    page,
    startUrl,
    "stable",
  );
  const evolvedEvidence = await collectRevalidationEvidence(
    page,
    startUrl,
    "evolved",
  );

  const stableRevision = buildRevalidatedVolatilityProfile(
    parentProfile,
    stableEvidence,
  );
  const evolvedRevision = buildRevalidatedVolatilityProfile(
    parentProfile,
    evolvedEvidence,
  );

  const stableSerialized =
    serializeFrozenVolatilityProfileRevision(stableRevision);
  const evolvedSerialized =
    serializeFrozenVolatilityProfileRevision(evolvedRevision);

  const parsedStableRevision =
    parseFrozenVolatilityProfileRevision(stableSerialized);
  const parsedEvolvedRevision =
    parseFrozenVolatilityProfileRevision(evolvedSerialized);

  const staleProfileFutureRun = await runEvolvedFutureCrawl(
    page,
    startUrl,
    parentProfile.profile,
  );
  const revokedProfileFutureRun = await runEvolvedFutureCrawl(
    page,
    startUrl,
    parsedEvolvedRevision.profile,
  );

  return {
    candidates,
    parentProfile,
    stableEvidence,
    evolvedEvidence,
    stableRevision,
    evolvedRevision,
    stableRevisionRoundTripStable:
      serializeFrozenVolatilityProfileRevision(parsedStableRevision) ===
      stableSerialized,
    evolvedRevisionRoundTripStable:
      serializeFrozenVolatilityProfileRevision(parsedEvolvedRevision) ===
      evolvedSerialized,
    staleProfileFutureRun,
    revokedProfileFutureRun,
  };
}

export function parentProfileSummary(
  artifact: FrozenVolatilityProfileArtifact,
) {
  return {
    rules: artifact.profile.rules.length,
    decisions: artifact.decisions.length,
  };
}

export function revisionSummary(
  artifact: FrozenVolatilityProfileRevisionArtifact,
) {
  return {
    rules: artifact.profile.rules.length,
    statuses: artifact.decisions.map((decision) => decision.status),
  };
}
