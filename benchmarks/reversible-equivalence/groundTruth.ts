export const REVERSIBLE_EQUIVALENCE_GROUND_TRUTH = {
  rawObservations: 6,
  rawTransitions: 7,
  trustedProjection: {
    states: 3,
    transitions: 6,
    dashboardMembers: 4,
  },
  revokedProjection: {
    states: 6,
    transitions: 7,
    dashboardStates: 4,
  },
  restoredProjection: {
    states: 3,
    transitions: 6,
  },
  rawArchiveDigestStableAcrossReprojection: true,
} as const;
