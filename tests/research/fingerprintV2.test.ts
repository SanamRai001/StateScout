import assert from "node:assert/strict";
import test from "node:test";

import { STATE_EQUIVALENCE_CASES } from "../../benchmarks/state-equivalence/cases.ts";
import { compareFingerprints } from "../../benchmarks/state-equivalence/compare.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";

test("v1 remains frozen while v2 removes the two measured false splits", () => {
  const comparison = compareFingerprints();

  assert.equal(comparison.v1.correct, 7);
  assert.equal(comparison.v1.falseMergeCount, 0);
  assert.equal(comparison.v1.falseSplitCount, 2);

  assert.equal(comparison.v2.correct, 9);
  assert.equal(comparison.v2.accuracy, 1);
  assert.equal(comparison.v2.sameF1, 1);
  assert.equal(comparison.v2.falseMergeCount, 0);
  assert.equal(comparison.v2.falseSplitCount, 0);

  assert.equal(comparison.delta.falseMergeCount, 0);
  assert.equal(comparison.delta.falseSplitCount, -2);
});

test("v2 does not mutate the v1 algorithm or version", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  assert.equal(fingerprintState(sample).version, 1);
  assert.equal(fingerprintStateV2(sample).version, 2);
});

test("v2 keeps non-tracking query values semantic", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  const left = fingerprintStateV2({ ...sample, query: { page: "1" } });
  const right = fingerprintStateV2({ ...sample, query: { page: "2" } });
  assert.notEqual(left.hash, right.hash);
});

test("v2 keeps meaningful numeric control text semantic", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  const left = fingerprintStateV2({ ...sample, controls: [{ role: "button", name: "Order 41" }] });
  const right = fingerprintStateV2({ ...sample, controls: [{ role: "button", name: "Order 42" }] });
  assert.notEqual(left.hash, right.hash);
});
