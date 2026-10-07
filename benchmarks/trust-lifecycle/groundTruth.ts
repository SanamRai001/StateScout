export const TRUST_LIFECYCLE_GROUND_TRUTH = {
  applicationScope: "statescout-fixture:v1",
  stableRetain: {
    state: "trusted",
    activeRules: 1,
  },
  transientChallenge: {
    state: "challenged",
    activeRules: 0,
  },
  duplicateChallenge: {
    state: "challenged",
    activeRules: 0,
  },
  challengeCleared: {
    state: "trusted",
    activeRules: 1,
  },
  persistentConflictFirst: {
    state: "challenged",
    activeRules: 0,
  },
  persistentConflictSecond: {
    state: "revoked",
    activeRules: 0,
  },
  recoveryFirst: {
    state: "cooldown",
    activeRules: 0,
  },
  recoverySecond: {
    state: "trusted",
    activeRules: 1,
  },
  staleTrustActiveRules: 0,
  scopeMismatchActiveRules: 0,
  staleEvidenceStatus: "stale-evidence",
  scopeMismatchStatus: "scope-mismatch",
  challengedEvolvedRun: {
    meaningfulDetailsCoverage: 1,
    states: 6,
    transitions: 6,
    attempts: 6,
    failedTransitions: 0,
  },
} as const;
