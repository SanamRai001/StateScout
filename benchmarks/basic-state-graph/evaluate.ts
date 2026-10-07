import type { StateGraph } from "../../src/core/graph.ts";

import { BASIC_STATE_GRAPH_GROUND_TRUTH } from "./ground-truth.ts";

export interface BenchmarkCoverage {
  expectedStates: number;
  discoveredStates: number;
  stateCoverage: number;
  expectedTransitions: number;
  discoveredTransitions: number;
  transitionCoverage: number;
  missingStates: readonly string[];
  missingTransitions: readonly string[];
}

function benchmarkStateName(snapshot: { headings: readonly string[]; dialogs: readonly string[]; controls: readonly { name?: string }[] }): string | undefined {
  const names = new Set(snapshot.controls.map((control) => control.name).filter(Boolean));
  if (snapshot.dialogs.length > 0) return "dialog-open";
  if (snapshot.headings.includes("Menu")) return "menu-open";
  if (snapshot.headings.includes("Details")) return "details";
  if (snapshot.headings.includes("About")) return "about";
  if (snapshot.headings.includes("Home") && names.has("Open menu")) return "home";
  return undefined;
}

function actionName(interaction: { target: { name?: string } }): string | undefined {
  const map: Record<string, string> = {
    "Open menu": "open-menu",
    "Close menu": "close-menu",
    "Open dialog": "open-dialog",
    "Cancel": "cancel-dialog",
    "Details": "open-details",
    "About": "open-about",
    "Read details": "open-details",
    "Home": "go-home",
  };
  return interaction.target.name ? map[interaction.target.name] : undefined;
}

export function evaluateBasicStateGraph(graph: StateGraph): BenchmarkCoverage {
  const namesById = new Map(
    graph.listStates().map((state) => [state.id, benchmarkStateName(state.snapshot)]),
  );
  const discoveredStates = new Set(
    [...namesById.values()].filter((value): value is string => Boolean(value)),
  );

  const discoveredTransitions = new Set<string>();
  for (const transition of graph.listTransitions()) {
    if (!transition.toStateId || transition.status !== "observed") continue;
    const from = namesById.get(transition.fromStateId);
    const to = namesById.get(transition.toStateId);
    const action = actionName(transition.interaction);
    if (from && action && to) discoveredTransitions.add([from, action, to].join("|"));
  }

  const expectedStates = new Set<string>(BASIC_STATE_GRAPH_GROUND_TRUTH.states);
  const expectedTransitions = new Set<string>(
    BASIC_STATE_GRAPH_GROUND_TRUTH.transitions.map((transition) => transition.join("|")),
  );
  const missingStates = [...expectedStates].filter((state) => !discoveredStates.has(state));
  const missingTransitions = [...expectedTransitions].filter((transition) => !discoveredTransitions.has(transition));

  return {
    expectedStates: expectedStates.size,
    discoveredStates: expectedStates.size - missingStates.length,
    stateCoverage: (expectedStates.size - missingStates.length) / expectedStates.size,
    expectedTransitions: expectedTransitions.size,
    discoveredTransitions: expectedTransitions.size - missingTransitions.length,
    transitionCoverage: (expectedTransitions.size - missingTransitions.length) / expectedTransitions.size,
    missingStates,
    missingTransitions,
  };
}
