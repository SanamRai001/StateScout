import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateOfflineProfilePromotion } from "../../benchmarks/offline-profile-promotion/evaluate.ts";
import { OFFLINE_PROMOTION_GROUND_TRUTH } from "../../benchmarks/offline-profile-promotion/groundTruth.ts";

const startUrl = pathToFileURL(
  resolve("benchmarks/offline-profile-promotion/index.html"),
).href;

test("Phase 12 promotes offline and only changes identity in a future run", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateOfflineProfilePromotion(page, startUrl);

  assert.equal(
    result.candidates.length,
    OFFLINE_PROMOTION_GROUND_TRUTH.expectedCandidateCount,
  );
  assert.equal(
    result.candidates[0]?.field,
    OFFLINE_PROMOTION_GROUND_TRUTH.expectedCandidateField,
  );
  assert.equal(
    result.candidates[0]?.sessionIds.length,
    OFFLINE_PROMOTION_GROUND_TRUTH.expectedCandidateSessions,
  );
  assert.equal(
    result.candidates[0]?.distinctValues.length,
    OFFLINE_PROMOTION_GROUND_TRUTH.expectedCandidateDistinctValues,
  );

  assert.equal(
    result.behaviorEvidence.records.length,
    OFFLINE_PROMOTION_GROUND_TRUTH.expectedBehaviorEvidenceRecords,
  );

  assert.equal(result.artifact.decisions.length, 1);
  assert.equal(result.artifact.decisions[0]?.promoted, true);
  assert.equal(result.artifact.profile.rules.length, 1);
  assert.equal(
    result.artifact.profile.rules[0]?.provenance,
    "verified-candidate-promotion",
  );
  assert.equal(result.artifactRoundTripStable, true);

  assert.deepEqual(result.emptyProfileRun, {
    ...OFFLINE_PROMOTION_GROUND_TRUTH.emptyProfileFutureRun,
    evidenceErrors: 0,
  });

  assert.deepEqual(result.promotedProfileRun, {
    ...OFFLINE_PROMOTION_GROUND_TRUTH.promotedProfileFutureRun,
    evidenceErrors: 0,
  });
});
