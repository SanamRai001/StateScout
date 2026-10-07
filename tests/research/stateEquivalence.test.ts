import assert from "node:assert/strict";
import test from "node:test";

import { STATE_EQUIVALENCE_CASES } from "../../benchmarks/state-equivalence/cases.ts";
import { evaluateEquivalence } from "../../benchmarks/state-equivalence/evaluate.ts";

test("equivalence benchmark reports known fingerprint-v1 limitations without hiding them", () => {
  const metrics = evaluateEquivalence(STATE_EQUIVALENCE_CASES);

  assert.equal(metrics.total, 9);
  assert.equal(metrics.falseMergeCount, 0);
  assert.equal(metrics.falseSplitCount, 2);
  assert.equal(metrics.correct, 7);
  assert.equal(metrics.accuracy, 7 / 9);
  assert.equal(metrics.falseSplitRate, 2 / 5);
  assert.equal(metrics.falseMergeRate, 0);
  assert.deepEqual(
    metrics.cases.filter((item) => !item.correct).map((item) => item.id),
    ["tracking-query-noise", "timestamp-title-noise"],
  );
});
