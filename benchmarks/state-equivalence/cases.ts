import type { SemanticStateSnapshot } from "../../src/core/model.ts";

export type EquivalenceLabel = "same" | "different";

export interface EquivalenceCase {
  id: string;
  label: EquivalenceLabel;
  reason: string;
  left: SemanticStateSnapshot;
  right: SemanticStateSnapshot;
}

const base: SemanticStateSnapshot = {
  origin: "https://fixture.statescout.test",
  path: "/dashboard",
  query: {},
  title: "Dashboard",
  headings: ["Dashboard"],
  landmarks: ["main"],
  dialogs: [],
  controls: [
    { role: "button", name: "Open menu" },
    { role: "link", name: "Reports" },
  ],
};

export const STATE_EQUIVALENCE_CASES: readonly EquivalenceCase[] = [
  {
    id: "control-order-noise",
    label: "same",
    reason: "DOM/control ordering changes while user semantics stay identical.",
    left: base,
    right: { ...base, controls: [...base.controls].reverse() },
  },
  {
    id: "whitespace-noise",
    label: "same",
    reason: "Whitespace-only text variation is not a new user-visible state.",
    left: base,
    right: { ...base, headings: ["  Dashboard  "], controls: [{ role: "button", name: " Open   menu " }, { role: "link", name: "Reports" }] },
  },
  {
    id: "query-order-noise",
    label: "same",
    reason: "Query key ordering is serialization noise.",
    left: { ...base, query: { page: "1", sort: "name" } },
    right: { ...base, query: { sort: "name", page: "1" } },
  },
  {
    id: "tracking-query-noise",
    label: "same",
    reason: "A tracking parameter should not create a meaningful application state.",
    left: base,
    right: { ...base, query: { utm_source: "experiment" } },
  },
  {
    id: "timestamp-title-noise",
    label: "same",
    reason: "A volatile timestamp in otherwise stable title text is noise.",
    left: { ...base, title: "Dashboard — 10:00:01" },
    right: { ...base, title: "Dashboard — 10:00:02" },
  },
  {
    id: "dialog-change",
    label: "different",
    reason: "Opening a dialog exposes a meaningfully different interaction state.",
    left: base,
    right: { ...base, dialogs: ["Delete confirmation"], controls: [...base.controls, { role: "button", name: "Cancel" }] },
  },
  {
    id: "selected-tab-change",
    label: "different",
    reason: "Changing the selected tab changes the active user-visible state.",
    left: { ...base, controls: [{ role: "tab", name: "Overview", selected: true }, { role: "tab", name: "Activity", selected: false }] },
    right: { ...base, controls: [{ role: "tab", name: "Overview", selected: false }, { role: "tab", name: "Activity", selected: true }] },
  },
  {
    id: "disabled-control-change",
    label: "different",
    reason: "A disabled action changes what the user can do.",
    left: { ...base, controls: [{ role: "button", name: "Continue", disabled: false }] },
    right: { ...base, controls: [{ role: "button", name: "Continue", disabled: true }] },
  },
  {
    id: "route-change",
    label: "different",
    reason: "Distinct application routes are different states in this fixture.",
    left: base,
    right: { ...base, path: "/reports", title: "Reports", headings: ["Reports"] },
  },
] as const;
