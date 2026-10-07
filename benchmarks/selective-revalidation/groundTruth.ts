export const SELECTIVE_REVALIDATION_GROUND_TRUTH = {
  applicationScope: "statescout-multirule:v1",
  referenceTime: "2026-01-10T12:00:00.000Z",
  maxTrustAgeMs: 10 * 24 * 60 * 60 * 1000,
  budget: 2,
  ranking: [
    {
      anchorHash: "anchor-challenged-critical",
      expectedState: "challenged",
      estimatedAffectedStates: 8,
      expectedScore: 150,
    },
    {
      anchorHash: "anchor-trusted-aging",
      expectedState: "trusted",
      estimatedAffectedStates: 6,
      expectedScore: 84,
    },
    {
      anchorHash: "anchor-cooldown-medium",
      expectedState: "cooldown",
      estimatedAffectedStates: 4,
      expectedScore: 80,
    },
    {
      anchorHash: "anchor-trusted-fresh-low",
      expectedState: "trusted",
      estimatedAffectedStates: 1,
      expectedScore: 11,
    },
  ],
  selectedAnchors: [
    "anchor-challenged-critical",
    "anchor-trusted-aging",
  ],
  isolation: {
    challengedBefore: "challenged",
    challengedAfterStableEvidence: "trusted",
    untouchedTrustedAging: "trusted",
    untouchedCooldown: "cooldown",
    untouchedFresh: "trusted",
  },
} as const;
