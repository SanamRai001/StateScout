export const EXPLORER_STRATEGY_GROUND_TRUTH = {
  meaningfulStateCount: 2,
  meaningfulStates: ["home", "details"],
  requiredSemanticTransitions: [
    ["home", "details"],
    ["details", "home"],
  ],
} as const;
