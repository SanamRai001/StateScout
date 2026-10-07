export interface RealWorldTransitionStatusCounts {
  observed: number;
  blockedByPolicy: number;
  failed: number;
  noStateChange: number;
}

export interface RealWorldSuccessfulRun {
  targetId: string;
  runIndex: number;
  status: "success";
  durationMs: number;
  initialFingerprintHash: string;
  graphSignature: string;
  stateCount: number;
  transitionCount: number;
  attemptedTransitions: number;
  evidenceErrorCount: number;
  transitionStatuses: RealWorldTransitionStatusCounts;
}

export interface RealWorldUnavailableRun {
  targetId: string;
  runIndex: number;
  status: "unavailable";
  durationMs: number;
  error: string;
}

export type RealWorldRun =
  | RealWorldSuccessfulRun
  | RealWorldUnavailableRun;

export interface NumericRange {
  min: number;
  max: number;
}

export interface RealWorldTargetSummary {
  targetId: string;
  requestedRuns: number;
  successfulRuns: number;
  unavailableRuns: number;
  availabilityRate: number;
  evaluable: boolean;
  initialFingerprintUniqueCount: number;
  graphSignatureUniqueCount: number;
  stableInitialFingerprint: boolean | null;
  stableGraphStructure: boolean | null;
  stateCountRange: NumericRange | null;
  transitionCountRange: NumericRange | null;
  attemptedTransitionRange: NumericRange | null;
  totalEvidenceErrors: number;
  transitionStatuses: RealWorldTransitionStatusCounts;
  unavailableErrors: readonly string[];
}

function range(values: readonly number[]): NumericRange | null {
  if (values.length === 0) return null;

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function emptyStatuses(): RealWorldTransitionStatusCounts {
  return {
    observed: 0,
    blockedByPolicy: 0,
    failed: 0,
    noStateChange: 0,
  };
}

export function summarizeRealWorldRuns(
  targetId: string,
  requestedRuns: number,
  runs: readonly RealWorldRun[],
  minimumSuccessfulRunsForStability = 2,
): RealWorldTargetSummary {
  if (!Number.isInteger(requestedRuns) || requestedRuns < 1) {
    throw new Error("requestedRuns must be a positive integer.");
  }

  if (
    !Number.isInteger(minimumSuccessfulRunsForStability) ||
    minimumSuccessfulRunsForStability < 1
  ) {
    throw new Error(
      "minimumSuccessfulRunsForStability must be a positive integer.",
    );
  }

  if (runs.some((run) => run.targetId !== targetId)) {
    throw new Error("Real-world run targetId mismatch.");
  }

  const successful = runs.filter(
    (run): run is RealWorldSuccessfulRun =>
      run.status === "success",
  );
  const unavailable = runs.filter(
    (run): run is RealWorldUnavailableRun =>
      run.status === "unavailable",
  );

  const transitionStatuses = successful.reduce(
    (total, run) => ({
      observed:
        total.observed + run.transitionStatuses.observed,
      blockedByPolicy:
        total.blockedByPolicy +
        run.transitionStatuses.blockedByPolicy,
      failed: total.failed + run.transitionStatuses.failed,
      noStateChange:
        total.noStateChange +
        run.transitionStatuses.noStateChange,
    }),
    emptyStatuses(),
  );

  const initialFingerprintUniqueCount = new Set(
    successful.map((run) => run.initialFingerprintHash),
  ).size;
  const graphSignatureUniqueCount = new Set(
    successful.map((run) => run.graphSignature),
  ).size;

  const evaluable =
    successful.length >= minimumSuccessfulRunsForStability;

  return {
    targetId,
    requestedRuns,
    successfulRuns: successful.length,
    unavailableRuns: unavailable.length,
    availabilityRate: successful.length / requestedRuns,
    evaluable,
    initialFingerprintUniqueCount,
    graphSignatureUniqueCount,
    stableInitialFingerprint: evaluable
      ? initialFingerprintUniqueCount === 1
      : null,
    stableGraphStructure: evaluable
      ? graphSignatureUniqueCount === 1
      : null,
    stateCountRange: range(
      successful.map((run) => run.stateCount),
    ),
    transitionCountRange: range(
      successful.map((run) => run.transitionCount),
    ),
    attemptedTransitionRange: range(
      successful.map((run) => run.attemptedTransitions),
    ),
    totalEvidenceErrors: successful.reduce(
      (total, run) => total + run.evidenceErrorCount,
      0,
    ),
    transitionStatuses,
    unavailableErrors: unavailable.map((run) => run.error),
  };
}

export interface RealWorldStudySummary {
  targets: number;
  requestedRuns: number;
  successfulRuns: number;
  unavailableRuns: number;
  evaluableTargets: number;
  stableInitialTargets: number;
  stableGraphTargets: number;
}

export function summarizeRealWorldStudy(
  targets: readonly RealWorldTargetSummary[],
): RealWorldStudySummary {
  return {
    targets: targets.length,
    requestedRuns: targets.reduce(
      (total, target) => total + target.requestedRuns,
      0,
    ),
    successfulRuns: targets.reduce(
      (total, target) => total + target.successfulRuns,
      0,
    ),
    unavailableRuns: targets.reduce(
      (total, target) => total + target.unavailableRuns,
      0,
    ),
    evaluableTargets: targets.filter(
      (target) => target.evaluable,
    ).length,
    stableInitialTargets: targets.filter(
      (target) => target.stableInitialFingerprint === true,
    ).length,
    stableGraphTargets: targets.filter(
      (target) => target.stableGraphStructure === true,
    ).length,
  };
}
