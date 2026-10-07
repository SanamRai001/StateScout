export type CorpusExpectedRelation = "same" | "different";

export interface Phase17CorpusCase {
  id: string;
  family:
    | "structural-noise"
    | "control-state"
    | "form-state"
    | "navigation"
    | "overlay"
    | "temporal"
    | "content-coverage";
  leftFixture: string;
  leftSuffix: string;
  rightFixture: string;
  rightSuffix: string;
  expected: CorpusExpectedRelation;
  rationale: string;
}

export const PHASE17_CORPUS_CASES: readonly Phase17CorpusCase[] = [
  {
    id: "wrapper-structure-noise",
    family: "structural-noise",
    leftFixture: "structural.html",
    leftSuffix: "#base",
    rightFixture: "structural.html",
    rightSuffix: "#wrapper-noise",
    expected: "same",
    rationale:
      "Generated wrappers, classes, IDs, test IDs, whitespace, and equivalent structure should not change semantic identity.",
  },
  {
    id: "control-order-noise",
    family: "structural-noise",
    leftFixture: "structural.html",
    leftSuffix: "#base",
    rightFixture: "structural.html",
    rightSuffix: "#control-order",
    expected: "same",
    rationale:
      "Equivalent controls rendered in a different DOM order should remain the same semantic state.",
  },
  {
    id: "known-tracking-query-noise",
    family: "structural-noise",
    leftFixture: "structural.html",
    leftSuffix: "#base",
    rightFixture: "structural.html",
    rightSuffix: "?utm_source=phase17&gclid=abc123#base",
    expected: "same",
    rationale:
      "Known tracking-only query parameters should not create a new semantic state.",
  },
  {
    id: "selected-tab-state",
    family: "control-state",
    leftFixture: "controls.html",
    leftSuffix: "#tab-home",
    rightFixture: "controls.html",
    rightSuffix: "#tab-reports",
    expected: "different",
    rationale:
      "Changing aria-selected changes the currently active tab and therefore the interaction state.",
  },
  {
    id: "expanded-panel-state",
    family: "control-state",
    leftFixture: "controls.html",
    leftSuffix: "#expanded-false",
    rightFixture: "controls.html",
    rightSuffix: "#expanded-true",
    expected: "different",
    rationale:
      "aria-expanded is a meaningful control-state distinction.",
  },
  {
    id: "checkbox-state",
    family: "control-state",
    leftFixture: "controls.html",
    leftSuffix: "#checked-false",
    rightFixture: "controls.html",
    rightSuffix: "#checked-true",
    expected: "different",
    rationale:
      "A visible checkbox changing checked state is meaningful UI state.",
  },
  {
    id: "disabled-control-state",
    family: "control-state",
    leftFixture: "controls.html",
    leftSuffix: "#disabled-false",
    rightFixture: "controls.html",
    rightSuffix: "#disabled-true",
    expected: "different",
    rationale:
      "Whether an affordance is disabled changes what the user can do.",
  },
  {
    id: "input-value-state",
    family: "form-state",
    leftFixture: "forms.html",
    leftSuffix: "#alice",
    rightFixture: "forms.html",
    rightSuffix: "#bob",
    expected: "different",
    rationale:
      "Different visible form values are meaningful state.",
  },
  {
    id: "semantic-record-query",
    family: "navigation",
    leftFixture: "navigation-a.html",
    leftSuffix: "?record=41#record",
    rightFixture: "navigation-a.html",
    rightSuffix: "?record=42#record",
    expected: "different",
    rationale:
      "A record identifier in an ordinary query parameter is semantic.",
  },
  {
    id: "query-order-noise",
    family: "navigation",
    leftFixture: "navigation-a.html",
    leftSuffix: "?a=1&b=2#query",
    rightFixture: "navigation-a.html",
    rightSuffix: "?b=2&a=1#query",
    expected: "same",
    rationale:
      "Query key ordering alone should not affect state identity.",
  },
  {
    id: "route-path-state",
    family: "navigation",
    leftFixture: "navigation-a.html",
    leftSuffix: "#same",
    rightFixture: "navigation-b.html",
    rightSuffix: "#same",
    expected: "different",
    rationale:
      "Different application paths remain distinct even when visible semantic content matches.",
  },
  {
    id: "dialog-open-state",
    family: "overlay",
    leftFixture: "overlays.html",
    leftSuffix: "#base",
    rightFixture: "overlays.html",
    rightSuffix: "#dialog-confirm",
    expected: "different",
    rationale:
      "Opening a dialog changes both visible context and available actions.",
  },
  {
    id: "dialog-identity-state",
    family: "overlay",
    leftFixture: "overlays.html",
    leftSuffix: "#dialog-delete",
    rightFixture: "overlays.html",
    rightSuffix: "#dialog-publish",
    expected: "different",
    rationale:
      "Different accessible dialog identities represent different UI states.",
  },
  {
    id: "meaningful-second-title",
    family: "temporal",
    leftFixture: "temporal.html",
    leftSuffix: "#auction-1",
    rightFixture: "temporal.html",
    rightSuffix: "#auction-2",
    expected: "different",
    rationale:
      "A second-resolution auction deadline is meaningful and must not be globally normalized away.",
  },
  {
    id: "plain-status-text-state",
    family: "content-coverage",
    leftFixture: "content.html",
    leftSuffix: "#status-ready",
    rightFixture: "content.html",
    rightSuffix: "#status-failed",
    expected: "different",
    rationale:
      "A visible non-heading status message changes the user-visible application state even without changing controls.",
  },
  {
    id: "list-content-state",
    family: "content-coverage",
    leftFixture: "content.html",
    leftSuffix: "#list-a",
    rightFixture: "content.html",
    rightSuffix: "#list-b",
    expected: "different",
    rationale:
      "Different visible list contents are meaningful state even when title, headings, landmarks, and controls are unchanged.",
  },
] as const;

export const PHASE17_CORPUS_FROZEN_COUNTS = {
  total: 16,
  same: 4,
  different: 12,
  families: 7,
} as const;
