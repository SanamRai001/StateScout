import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import {
  assessVolatilityCandidate,
  discoverVolatilityCandidate,
  promoteVolatilityCandidate,
  volatilityFieldValue,
  type CandidateBehaviorEvidence,
  type CandidateObservation,
} from "../../src/core/volatilityCandidates.ts";
import {
  createVolatilityProfile,
  volatilityAnchorHash,
} from "../../src/core/volatility.ts";
import { CANDIDATE_PROMOTION_EVALUATION_CASES } from "./groundTruth.ts";

type ExpectedRelation = "same" | "different";
type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;
type GroundTruthCase =
  (typeof CANDIDATE_PROMOTION_EVALUATION_CASES)[number];

interface ObservedPair {
  candidate: GroundTruthCase;
  left: SemanticStateSnapshot;
  right: SemanticStateSnapshot;
}

async function snapshot(
  page: Page,
  baseUrl: string,
  suffix: string,
): Promise<SemanticStateSnapshot> {
  await page.goto(baseUrl + suffix);
  await page.reload();
  return observePage(page);
}

async function collectCandidateEvidence(
  page: Page,
  baseUrl: string,
  variants: readonly { sessionId: string; suffix: string }[],
) {
  const observations: CandidateObservation[] = [];
  const behaviorEvidence: CandidateBehaviorEvidence[] = [];

  for (const variant of variants) {
    await page.goto(baseUrl + variant.suffix);
    await page.reload();

    const before = await observePage(page);
    observations.push({
      sessionId: variant.sessionId,
      snapshot: before,
    });

    await page.getByRole("button").first().click();
    const after = await observePage(page);

    behaviorEvidence.push({
      sessionId: variant.sessionId,
      sourceAnchorHash: volatilityAnchorHash(before, "title"),
      fieldValue: volatilityFieldValue(before, "title"),
      behaviorSignature: fingerprintState(after).hash,
    });
  }

  const candidate = discoverVolatilityCandidate(observations, "title");
  const assessment = assessVolatilityCandidate(candidate, behaviorEvidence);

  return {
    candidate,
    assessment,
    behaviorEvidence,
  };
}

export async function evaluateCandidatePromotion(
  page: Page,
  baseUrl: string,
) {
  const dashboardEvidence = await collectCandidateEvidence(page, baseUrl, [
    { sessionId: "dashboard-session-a", suffix: "#dashboard-a1" },
    { sessionId: "dashboard-session-a", suffix: "#dashboard-a2" },
    { sessionId: "dashboard-session-b", suffix: "#dashboard-b1" },
    { sessionId: "dashboard-session-b", suffix: "#dashboard-b2" },
  ]);

  const auctionEvidence = await collectCandidateEvidence(page, baseUrl, [
    { sessionId: "auction-session-a", suffix: "#auction-a1" },
    { sessionId: "auction-session-a", suffix: "#auction-a2" },
    { sessionId: "auction-session-b", suffix: "#auction-b1" },
    { sessionId: "auction-session-b", suffix: "#auction-b2" },
  ]);

  const promotedDashboardRule = promoteVolatilityCandidate(
    dashboardEvidence.candidate,
    dashboardEvidence.behaviorEvidence,
  );

  const profile = createVolatilityProfile([promotedDashboardRule]);
  const v4 = createFingerprintStateV4(profile);
  const v4WithoutProfile = createFingerprintStateV4(
    createVolatilityProfile([]),
  );

  const pairs: ObservedPair[] = [];
  for (const candidate of CANDIDATE_PROMOTION_EVALUATION_CASES) {
    pairs.push({
      candidate,
      left: await snapshot(page, baseUrl, candidate.left),
      right: await snapshot(page, baseUrl, candidate.right),
    });
  }

  const evaluate = (fingerprinter: Fingerprinter) => {
    const cases = pairs.map(({ candidate, left, right }) => {
      const predicted: ExpectedRelation =
        fingerprinter(left).hash === fingerprinter(right).hash
          ? "same"
          : "different";

      return {
        id: candidate.id,
        expected: candidate.expected,
        predicted,
        correct: predicted === candidate.expected,
        rationale: candidate.rationale,
      };
    });

    return {
      total: cases.length,
      correct: cases.filter((item) => item.correct).length,
      falseMerges: cases.filter(
        (item) => item.expected === "different" && item.predicted === "same",
      ).length,
      falseSplits: cases.filter(
        (item) => item.expected === "same" && item.predicted === "different",
      ).length,
      cases,
    };
  };

  return {
    dashboardCandidate: {
      candidate: dashboardEvidence.candidate,
      assessment: dashboardEvidence.assessment,
    },
    auctionCandidate: {
      candidate: auctionEvidence.candidate,
      assessment: auctionEvidence.assessment,
    },
    promotedProfile: profile,
    v3: evaluate(fingerprintStateV3),
    v4WithoutProfile: evaluate(v4WithoutProfile),
    v4WithPromotedProfile: evaluate(v4),
  };
}
