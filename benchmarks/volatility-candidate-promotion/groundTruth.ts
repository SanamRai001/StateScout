export const CANDIDATE_PROMOTION_EVALUATION_CASES = [
  {
    id: "held-out-dashboard-title",
    left: "#dashboard-holdout-c",
    right: "#dashboard-holdout-d",
    expected: "same",
    rationale: "A promoted Dashboard title candidate should generalize to unseen values on the same semantic anchor.",
  },
  {
    id: "held-out-auction-title",
    left: "#auction-holdout-c",
    right: "#auction-holdout-d",
    expected: "different",
    rationale: "The Auction title candidate must remain quarantined because safe probes reveal divergent downstream behavior.",
  },
] as const;
