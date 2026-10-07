import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateExplorerEvidenceStore } from "../../benchmarks/explorer-evidence-store/evaluate.ts";
import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import { createVolatilityProfile } from "../../src/core/volatility.ts";
import { EXPLORER_EVIDENCE_GROUND_TRUTH } from "../../benchmarks/explorer-evidence-store/groundTruth.ts";

const startUrl = pathToFileURL(
  resolve("benchmarks/explorer-evidence-store/index.html"),
).href;

test("Phase 11 collects cross-run evidence without changing run-frozen identity", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateExplorerEvidenceStore(page, startUrl);

  assert.equal(result.identityInvariant.baselineEqualsSessionA, true);
  assert.equal(result.identityInvariant.baselineEqualsSessionB, true);

  assert.equal(
    result.graph.states,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedGraphStates,
  );
  assert.equal(
    result.graph.transitions,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedGraphTransitions,
  );
  assert.equal(
    result.graph.attemptedTransitions,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedAttempts,
  );

  assert.deepEqual(result.evidenceErrors, {
    baseline: 0,
    sessionA: 0,
    sessionB: 0,
  });

  assert.equal(result.stores.roundTripStable, true);
  assert.equal(result.stores.idempotentMergeStable, true);
  assert.deepEqual(result.stores.merged.sessions, [
    "phase11-session-a",
    "phase11-session-b",
  ]);

  assert.equal(
    result.candidates.length,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedCandidateCount,
  );
  assert.equal(
    result.candidates[0]?.field,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedCandidateField,
  );
  assert.equal(
    result.candidates[0]?.sessionIds.length,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedCandidateSessions,
  );
  assert.equal(
    result.candidates[0]?.distinctValues.length,
    EXPLORER_EVIDENCE_GROUND_TRUTH.expectedDistinctValues,
  );
  assert.equal(result.candidates[0]?.status, "quarantined");
});


test("evidence sink failures are isolated from the frozen explorer graph", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const baselinePage = await browser.newPage();
  const faultyPage = await browser.newPage();
  const fingerprinter = createFingerprintStateV4(createVolatilityProfile([]));

  const baseline = await exploreWithPlaywright(baselinePage, {
    startUrl,
    maxTransitions: 2,
    fingerprinter,
  });

  const faulty = await exploreWithPlaywright(faultyPage, {
    startUrl,
    maxTransitions: 2,
    fingerprinter,
    observationSink: () => {
      throw new Error("synthetic evidence sink failure");
    },
  });

  assert.equal(faulty.graph.stateCount, baseline.graph.stateCount);
  assert.equal(faulty.graph.transitionCount, baseline.graph.transitionCount);
  assert.equal(faulty.attemptedTransitions, baseline.attemptedTransitions);
  assert.ok(faulty.evidenceErrors.length > 0);
  assert.ok(
    faulty.evidenceErrors.every(
      (message) => message === "synthetic evidence sink failure",
    ),
  );
});
