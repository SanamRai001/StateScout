import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateCandidatePromotion } from "../../benchmarks/volatility-candidate-promotion/evaluate.ts";

const baseUrl = pathToFileURL(
  resolve("benchmarks/volatility-candidate-promotion/index.html"),
).href;

test("Phase 10 promotes stable-behavior volatility and quarantines divergent behavior", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateCandidatePromotion(page, baseUrl);

  assert.equal(result.dashboardCandidate.assessment.eligible, true);
  assert.equal(result.dashboardCandidate.assessment.behaviorSignatureCount, 1);

  assert.equal(result.auctionCandidate.assessment.eligible, false);
  assert.equal(result.auctionCandidate.assessment.behaviorSignatureCount, 2);
  assert.ok(
    result.auctionCandidate.assessment.reasons.includes(
      "safe probe produced divergent downstream behavior",
    ),
  );

  assert.equal(result.promotedProfile.rules.length, 1);
  assert.equal(
    result.promotedProfile.rules[0]?.provenance,
    "verified-candidate-promotion",
  );

  assert.equal(result.v3.correct, 0);
  assert.equal(result.v3.falseMerges, 1);
  assert.equal(result.v3.falseSplits, 1);

  assert.equal(result.v4WithoutProfile.correct, 1);
  assert.equal(result.v4WithoutProfile.falseMerges, 0);
  assert.equal(result.v4WithoutProfile.falseSplits, 1);

  assert.equal(result.v4WithPromotedProfile.correct, 2);
  assert.equal(result.v4WithPromotedProfile.falseMerges, 0);
  assert.equal(result.v4WithPromotedProfile.falseSplits, 0);
});
