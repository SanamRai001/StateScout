export const BROWSER_GENERALIZATION_GROUND_TRUTH = [
  { id: "wrapper-class-id-title-tracking-noise", left: "#base", right: "?utm_source=phase4#noise-b", expected: "same" },
  { id: "meaningful-query-state", left: "#base", right: "?page=2#page-two", expected: "different" },
  { id: "dialog-state", left: "#base", right: "#dialog", expected: "different" },
  { id: "disabled-affordance", left: "#base", right: "#disabled", expected: "different" },
] as const;
