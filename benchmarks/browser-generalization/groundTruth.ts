export const BROWSER_GENERALIZATION_GROUND_TRUTH = [
  { id: "wrapper-class-id-title-tracking-noise", left: "?variant=base", right: "?variant=noise-b&utm_source=phase4", expected: "same" },
  { id: "meaningful-query-state", left: "?variant=base", right: "?variant=page-two", expected: "different" },
  { id: "dialog-state", left: "?variant=base", right: "?variant=dialog", expected: "different" },
  { id: "disabled-affordance", left: "?variant=base", right: "?variant=disabled", expected: "different" },
] as const;
