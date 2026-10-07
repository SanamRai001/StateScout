import assert from "node:assert/strict";
import test from "node:test";

import { STATE_EQUIVALENCE_CASES } from "../../benchmarks/state-equivalence/cases.ts";
import { evaluateEquivalence } from "../../benchmarks/state-equivalence/evaluate.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";

test("v3 preserves Phase 2 equivalence wins while restoring adversarial semantics", () => {
  const metrics = evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintStateV3);

  assert.equal(metrics.total, 9);
  assert.equal(metrics.correct, 9);
  assert.equal(metrics.falseMergeCount, 0);
  assert.equal(metrics.falseSplitCount, 0);
});

test("v3 uses the new fingerprint version", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  assert.equal(fingerprintStateV3(sample).version, 3);
});

test("v3 preserves minute-resolution title time as semantic", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  const left = fingerprintStateV3({ ...sample, title: "Appointment — 10:00" });
  const right = fingerprintStateV3({ ...sample, title: "Appointment — 11:00" });
  assert.notEqual(left.hash, right.hash);
});

test("v3 preserves ref query values as semantic", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  const left = fingerprintStateV3({ ...sample, query: { ref: "invoice-41" } });
  const right = fingerprintStateV3({ ...sample, query: { ref: "invoice-42" } });
  assert.notEqual(left.hash, right.hash);
});

test("v3 still normalizes measured second-resolution volatile title clocks", () => {
  const sample = STATE_EQUIVALENCE_CASES[0]!.left;
  const left = fingerprintStateV3({ ...sample, title: "Dashboard — 10:00:01" });
  const right = fingerprintStateV3({ ...sample, title: "Dashboard — 10:00:02" });
  assert.equal(left.hash, right.hash);
});
