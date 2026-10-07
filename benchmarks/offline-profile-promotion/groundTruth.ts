export const OFFLINE_PROMOTION_GROUND_TRUTH = {
  evidenceRunMaxTransitions: 6,
  expectedCandidateCount: 1,
  expectedCandidateField: "title",
  expectedCandidateSessions: 2,
  expectedCandidateDistinctValues: 4,
  expectedBehaviorEvidenceRecords: 4,
  expectedPromotedRules: 1,
  emptyProfileFutureRun: {
    states: 5,
    transitions: 6,
    attempts: 6,
    failedTransitions: 0,
  },
  promotedProfileFutureRun: {
    states: 2,
    transitions: 3,
    attempts: 3,
    failedTransitions: 0,
  },
} as const;
