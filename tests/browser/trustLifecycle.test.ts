import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { evaluateTrustLifecycle } from "../../benchmarks/trust-lifecycle/evaluate.ts";
import { TRUST_LIFECYCLE_GROUND_TRUTH } from "../../benchmarks/trust-lifecycle/groundTruth.ts";

const startUrl = pathToFileURL(resolve("benchmarks/profile-revalidation/index.html")).href;

test("Phase 14 manages freshness, challenge windows, revocation, and restoration", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const result = await evaluateTrustLifecycle(page, startUrl);

  assert.deepEqual(result.states, {
    stableRetain: "trusted",
    transientChallenge: "challenged",
    duplicateChallenge: "challenged",
    challengeCleared: "trusted",
    persistentConflictFirst: "challenged",
    persistentConflictSecond: "revoked",
    recoveryFirst: "cooldown",
    recoverySecond: "trusted",
  });
  assert.deepEqual(result.activeRules, {
    stableRetain: 1,
    transientChallenge: 0,
    duplicateChallenge: 0,
    challengeCleared: 1,
    persistentConflictFirst: 0,
    persistentConflictSecond: 0,
    recoveryFirst: 0,
    recoverySecond: 1,
  });

  assert.equal(result.duplicateWindowStatus, "duplicate-window");
  assert.equal(result.staleEvidenceStatus, TRUST_LIFECYCLE_GROUND_TRUTH.staleEvidenceStatus);
  assert.equal(result.scopeMismatchStatus, TRUST_LIFECYCLE_GROUND_TRUTH.scopeMismatchStatus);
  assert.equal(result.staleTrust.profile.rules.length, 0);
  assert.equal(result.staleTrust.inactive[0]?.reason, "stale-trust");
  assert.equal(result.scopeMismatch.profile.rules.length, 0);
  assert.equal(result.scopeMismatch.inactive[0]?.reason, "scope-mismatch");
  assert.equal(result.roundTripStable, true);

  assert.deepEqual(result.challengedEvolvedRun, {
    ...TRUST_LIFECYCLE_GROUND_TRUTH.challengedEvolvedRun,
    observedDetails: ["Dashboard priority details", "Dashboard standard details"],
    evidenceErrors: 0,
  });
});
