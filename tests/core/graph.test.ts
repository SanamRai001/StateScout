import assert from "node:assert/strict";
import test from "node:test";

import { StateGraph } from "../../src/core/graph.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
} from "../../src/core/model.ts";

function state(
  headings: readonly string[],
  dialogs: readonly string[] = [],
): SemanticStateSnapshot {
  return {
    origin: "https://example.test",
    path: "/",
    query: {},
    headings,
    landmarks: ["main"],
    dialogs,
    controls: [],
  };
}

const detailsInteraction: Interaction = {
  id: "open-details",
  kind: "click",
  risk: "safe",
  target: { role: "button", name: "Details" },
  locatorCandidates: [],
};

test("graph deduplicates semantically equivalent states", () => {
  const graph = new StateGraph();

  const first = graph.upsertState(state(["Home"]));
  const second = graph.upsertState(state(["  Home  "]));

  assert.equal(first.isNew, true);
  assert.equal(second.isNew, false);
  assert.equal(first.node.id, second.node.id);
  assert.equal(graph.stateCount, 1);
});

test("same route can contain distinct states", () => {
  const graph = new StateGraph();

  graph.upsertState(state(["Home"]));
  graph.upsertState(state(["Home"], ["Example dialog"]));

  assert.equal(graph.stateCount, 2);
});

test("multiple parent states can converge on one destination state", () => {
  const graph = new StateGraph();

  const dialog = graph.upsertState(state(["Home"], ["Example dialog"])).node;
  const about = graph.upsertState(state(["About"])).node;
  const details = graph.upsertState(state(["Details"])).node;

  graph.addTransition({
    fromStateId: dialog.id,
    toStateId: details.id,
    interaction: detailsInteraction,
    status: "observed",
  });

  graph.addTransition({
    fromStateId: about.id,
    toStateId: details.id,
    interaction: {
      ...detailsInteraction,
      id: "read-details",
      target: { role: "button", name: "Read details" },
    },
    status: "observed",
  });

  assert.equal(graph.stateCount, 3);
  assert.equal(graph.transitionCount, 2);

  const destinations = graph
    .listTransitions()
    .map((transition) => transition.toStateId);

  assert.deepEqual(destinations, [details.id, details.id]);
});
