export const PROFILE_REVALIDATION_GROUND_TRUTH = {
  promotion: {
    observationSessions: 2,
    distinctValues: 4,
    behaviorEvidenceRecords: 4,
    promotedRules: 1,
  },
  stableRevalidation: {
    status: "retained",
    behaviorSignatures: 1,
    resultingRules: 1,
  },
  evolvedRevalidation: {
    status: "revoked",
    behaviorSignatures: 2,
    resultingRules: 0,
  },
  evolvedFutureRunWithStaleProfile: {
    meaningfulDetailsCoverage: 0.5,
    states: 2,
    transitions: 3,
    attempts: 3,
    failedTransitions: 0,
  },
  evolvedFutureRunWithRevokedProfile: {
    meaningfulDetailsCoverage: 1,
    states: 6,
    transitions: 6,
    attempts: 6,
    failedTransitions: 0,
  },
} as const;
