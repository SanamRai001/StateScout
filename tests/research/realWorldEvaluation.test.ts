import assert from "node:assert/strict";
import test from "node:test";

import {
  isRealWorldStudyEvaluable,
  summarizeRealWorldRuns,
  summarizeRealWorldStudy,
  type RealWorldRun,
} from "../../src/research/realWorldEvaluation.ts";

function success(
  runIndex: number,
  overrides: Partial<Extract<RealWorldRun, { status: "success" }>> = {},
): Extract<RealWorldRun, { status: "success" }> {
  return {
    targetId: "target-a",
    runIndex,
    status: "success",
    durationMs: 100,
    initialFingerprintHash: "initial-a",
    graphSignature: "graph-a",
    stateCount: 2,
    transitionCount: 3,
    attemptedTransitions: 3,
    evidenceErrorCount: 0,
    transitionStatuses: {
      observed: 1,
      blockedByPolicy: 1,
      failed: 0,
      noStateChange: 1,
    },
    ...overrides,
  };
}

test("real-world summary separates availability from stability", () => {
  const runs: RealWorldRun[] = [
    success(1),
    success(2),
    {
      targetId: "target-a",
      runIndex: 3,
      status: "unavailable",
      durationMs: 15_000,
      error: "navigation timeout",
    },
  ];

  const summary = summarizeRealWorldRuns("target-a", 3, runs, 2);

  assert.equal(summary.successfulRuns, 2);
  assert.equal(summary.unavailableRuns, 1);
  assert.equal(summary.runErrorRuns, 0);
  assert.equal(summary.availabilityRate, 2 / 3);
  assert.equal(summary.evaluable, true);
  assert.equal(summary.stableInitialFingerprint, true);
  assert.equal(summary.stableGraphStructure, true);
  assert.deepEqual(summary.stateCountRange, { min: 2, max: 2 });
  assert.deepEqual(summary.transitionCountRange, { min: 3, max: 3 });
  assert.deepEqual(summary.attemptedTransitionRange, { min: 3, max: 3 });
  assert.deepEqual(summary.transitionStatuses, {
    observed: 2,
    blockedByPolicy: 2,
    failed: 0,
    noStateChange: 2,
  });
  assert.deepEqual(summary.unavailableErrors, ["navigation timeout"]);
  assert.deepEqual(summary.runErrors, []);
});

test("reachable run errors are separated from external unavailability", () => {
  const summary = summarizeRealWorldRuns(
    "target-a",
    3,
    [
      success(1),
      {
        targetId: "target-a",
        runIndex: 2,
        status: "run-error",
        durationMs: 250,
        error: "observer crashed",
      },
      {
        targetId: "target-a",
        runIndex: 3,
        status: "unavailable",
        durationMs: 15_000,
        error: "dns",
      },
    ],
    2,
  );

  assert.equal(summary.successfulRuns, 1);
  assert.equal(summary.runErrorRuns, 1);
  assert.equal(summary.unavailableRuns, 1);
  assert.equal(summary.availabilityRate, 2 / 3);
  assert.deepEqual(summary.runErrors, ["observer crashed"]);
  assert.equal(summary.evaluable, false);
});

test("real-world summary detects graph instability independently of initial identity", () => {
  const summary = summarizeRealWorldRuns(
    "target-a",
    3,
    [
      success(1),
      success(2, {
        graphSignature: "graph-b",
        stateCount: 3,
        transitionCount: 4,
      }),
      success(3),
    ],
  );

  assert.equal(summary.initialFingerprintUniqueCount, 1);
  assert.equal(summary.graphSignatureUniqueCount, 2);
  assert.equal(summary.stableInitialFingerprint, true);
  assert.equal(summary.stableGraphStructure, false);
  assert.deepEqual(summary.stateCountRange, { min: 2, max: 3 });
  assert.deepEqual(summary.transitionCountRange, { min: 3, max: 4 });
});

test("insufficient successful runs remain unavailable for stability claims", () => {
  const summary = summarizeRealWorldRuns(
    "target-a",
    3,
    [
      success(1),
      {
        targetId: "target-a",
        runIndex: 2,
        status: "unavailable",
        durationMs: 100,
        error: "dns",
      },
      {
        targetId: "target-a",
        runIndex: 3,
        status: "unavailable",
        durationMs: 100,
        error: "timeout",
      },
    ],
    2,
  );

  assert.equal(summary.evaluable, false);
  assert.equal(summary.stableInitialFingerprint, null);
  assert.equal(summary.stableGraphStructure, null);
});

test("study summary aggregates only explicit evaluable and stable targets", () => {
  const stable = summarizeRealWorldRuns(
    "target-a",
    3,
    [success(1), success(2), success(3)],
  );
  const unstable = summarizeRealWorldRuns(
    "target-b",
    3,
    [
      { ...success(1), targetId: "target-b" },
      {
        ...success(2),
        targetId: "target-b",
        graphSignature: "different",
      },
      { ...success(3), targetId: "target-b" },
    ],
  );
  const unavailable = summarizeRealWorldRuns(
    "target-c",
    3,
    [
      {
        targetId: "target-c",
        runIndex: 1,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
      {
        targetId: "target-c",
        runIndex: 2,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
      {
        targetId: "target-c",
        runIndex: 3,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
    ],
  );

  assert.deepEqual(
    summarizeRealWorldStudy([stable, unstable, unavailable]),
    {
      targets: 3,
      requestedRuns: 9,
      successfulRuns: 6,
      unavailableRuns: 3,
      runErrorRuns: 0,
      evaluableTargets: 2,
      stableInitialTargets: 2,
      stableGraphTargets: 1,
    },
  );
});


test("Phase 19 recovery target manifest is distinct and pre-registered", async () => {
  const {
    PHASE19_REAL_WORLD_TARGETS,
  } = await import("../../benchmarks/real-world-v1/targets.ts");
  const {
    PHASE19_RECOVERY_TARGETS,
    PHASE19_RECOVERY_PROTOCOL,
  } = await import("../../benchmarks/real-world-v1/recoveryTargets.ts");

  assert.equal(PHASE19_REAL_WORLD_TARGETS.length, 3);
  assert.equal(PHASE19_RECOVERY_TARGETS.length, 2);

  const combined = [
    ...PHASE19_REAL_WORLD_TARGETS,
    ...PHASE19_RECOVERY_TARGETS,
  ];

  assert.equal(
    new Set(combined.map((target) => target.id)).size,
    5,
  );
  assert.equal(
    new Set(combined.map((target) => target.url)).size,
    5,
  );
  assert.equal(
    PHASE19_RECOVERY_PROTOCOL.minimumCombinedEvaluableTargets,
    2,
  );
  assert.equal(
    PHASE19_RECOVERY_PROTOCOL.fallbackTargetsChosenBeforeFallbackOutcomes,
    true,
  );
});

test("combined Phase 19 acceptance can be satisfied across primary and recovery cohorts", () => {
  const primaryEvaluable = summarizeRealWorldRuns(
    "primary-a",
    3,
    [
      { ...success(1), targetId: "primary-a" },
      { ...success(2), targetId: "primary-a" },
      { ...success(3), targetId: "primary-a" },
    ],
  );
  const primaryUnavailable = summarizeRealWorldRuns(
    "primary-b",
    3,
    [
      {
        targetId: "primary-b",
        runIndex: 1,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
      {
        targetId: "primary-b",
        runIndex: 2,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
      {
        targetId: "primary-b",
        runIndex: 3,
        status: "unavailable",
        durationMs: 1,
        error: "offline",
      },
    ],
  );
  const recoveryEvaluable = summarizeRealWorldRuns(
    "recovery-a",
    3,
    [
      { ...success(1), targetId: "recovery-a" },
      { ...success(2), targetId: "recovery-a" },
      { ...success(3), targetId: "recovery-a" },
    ],
  );

  assert.equal(
    isRealWorldStudyEvaluable(
      [primaryEvaluable, primaryUnavailable],
      2,
    ),
    false,
  );
  assert.equal(
    isRealWorldStudyEvaluable(
      [
        primaryEvaluable,
        primaryUnavailable,
        recoveryEvaluable,
      ],
      2,
    ),
    true,
  );
});
