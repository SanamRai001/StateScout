import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateProfileRevalidation } from "../../benchmarks/profile-revalidation/evaluate.ts";
import { PROFILE_REVALIDATION_GROUND_TRUTH } from "../../benchmarks/profile-revalidation/groundTruth.ts";

const startUrl = pathToFileURL(
  resolve("benchmarks/profile-revalidation/index.html"),
).href;

test("Phase 13 retains stable rules and revokes stale rules after behavior drift", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateProfileRevalidation(page, startUrl);

  assert.equal(
    result.candidates.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.promotion.promotedRules,
  );
  assert.equal(
    result.candidates[0]?.sessionIds.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.promotion.observationSessions,
  );
  assert.equal(
    result.candidates[0]?.distinctValues.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.promotion.distinctValues,
  );
  assert.equal(
    result.parentProfile.profile.rules.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.promotion.promotedRules,
  );

  const stableDecision = result.stableRevision.decisions[0];
  assert.equal(
    stableDecision?.status,
    PROFILE_REVALIDATION_GROUND_TRUTH.stableRevalidation.status,
  );
  assert.equal(
    stableDecision?.behaviorSignatureCount,
    PROFILE_REVALIDATION_GROUND_TRUTH.stableRevalidation.behaviorSignatures,
  );
  assert.equal(
    result.stableRevision.profile.rules.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.stableRevalidation.resultingRules,
  );
  assert.equal(result.stableRevisionRoundTripStable, true);

  const evolvedDecision = result.evolvedRevision.decisions[0];
  assert.equal(
    evolvedDecision?.status,
    PROFILE_REVALIDATION_GROUND_TRUTH.evolvedRevalidation.status,
  );
  assert.equal(
    evolvedDecision?.behaviorSignatureCount,
    PROFILE_REVALIDATION_GROUND_TRUTH.evolvedRevalidation.behaviorSignatures,
  );
  assert.equal(
    result.evolvedRevision.profile.rules.length,
    PROFILE_REVALIDATION_GROUND_TRUTH.evolvedRevalidation.resultingRules,
  );
  assert.ok(
    evolvedDecision?.reasons.includes(
      "later safe probes produced divergent downstream behavior",
    ),
  );
  assert.equal(result.evolvedRevisionRoundTripStable, true);

  assert.deepEqual(result.staleProfileFutureRun, {
    ...PROFILE_REVALIDATION_GROUND_TRUTH.evolvedFutureRunWithStaleProfile,
    observedDetails: ["Dashboard standard details"],
    evidenceErrors: 0,
  });

  assert.deepEqual(result.revokedProfileFutureRun, {
    ...PROFILE_REVALIDATION_GROUND_TRUTH.evolvedFutureRunWithRevokedProfile,
    observedDetails: [
      "Dashboard priority details",
      "Dashboard standard details",
    ],
    evidenceErrors: 0,
  });
});
