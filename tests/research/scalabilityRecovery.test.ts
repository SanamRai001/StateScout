import assert from "node:assert/strict";
import test from "node:test";

import { PHASE20_GROUND_TRUTH } from "../../benchmarks/scalability-recovery/groundTruth.ts";
import {
  measureSyntheticScale,
  verifySyntheticCheckpointRecovery,
} from "../../src/research/scalabilityRecovery.ts";

test("Phase 20 synthetic scale reaches frozen 64/128/256-state counts", () => {
  for (const expected of PHASE20_GROUND_TRUTH.syntheticScale) {
    const measured = measureSyntheticScale(expected.states);

    assert.deepEqual(
      {
        states: measured.states,
        transitions: measured.transitions,
        attempts: measured.attempts,
        failedTransitions: measured.failedTransitions,
      },
      {
        states: expected.states,
        transitions: expected.totalTransitions,
        attempts: expected.attempts,
        failedTransitions: expected.injectedFailedTransitions,
      },
    );

    assert.equal(
      Number.isFinite(measured.durationMs) &&
        measured.durationMs >= 0,
      true,
    );
    assert.equal(
      Number.isInteger(measured.heapDeltaBytes),
      true,
    );
  }
});

test("Phase 20 synthetic checkpoint resume matches uninterrupted graph", () => {
  const expected = PHASE20_GROUND_TRUTH.checkpointRecovery;
  const result = verifySyntheticCheckpointRecovery(
    expected.states,
    expected.interruptAfterAttempts,
  );

  assert.equal(
    result.partial.attemptedTransitions,
    expected.interruptAfterAttempts,
  );
  assert.equal(
    result.uninterrupted.attemptedTransitions,
    expected.finalAttempts,
  );
  assert.equal(
    result.resumed.attemptedTransitions,
    expected.finalAttempts,
  );
  assert.equal(
    result.resumed.graph.stateCount,
    expected.finalStates,
  );
  assert.equal(
    result.resumed.graph.transitionCount,
    expected.finalTransitions,
  );
  assert.equal(
    result.resumed.failedTransitions,
    expected.finalFailedTransitions,
  );
  assert.equal(
    result.resumedMatchesUninterrupted,
    expected.resumedMatchesUninterrupted,
  );
  assert.equal(
    result.corruptedCheckpointRejected,
    expected.corruptedCheckpointRejected,
  );
  assert.ok(result.serializedCheckpointBytes > 0);
});
