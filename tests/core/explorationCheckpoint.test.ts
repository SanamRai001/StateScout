import assert from "node:assert/strict";
import test from "node:test";

import {
  createExplorationCheckpointArtifact,
  parseExplorationCheckpoint,
  serializeExplorationCheckpoint,
} from "../../src/browser/explorationCheckpoint.ts";
import { BfsFrontier } from "../../src/core/frontier.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { StateGraph } from "../../src/core/graph.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
} from "../../src/core/model.ts";

function snapshot(title: string): SemanticStateSnapshot {
  return {
    origin: "https://checkpoint.statescout.local",
    path: `/${title.toLowerCase()}`,
    query: {},
    title,
    headings: [title],
    landmarks: ["main"],
    dialogs: [],
    controls: [],
  };
}

function interaction(id: string): Interaction {
  return {
    id,
    kind: "click",
    risk: "safe",
    target: {
      role: "button",
      name: id,
    },
    locatorCandidates: [
      {
        strategy: "role",
        value: JSON.stringify(["button", id]),
        score: 1,
      },
    ],
  };
}

test("BFS frontier snapshot preserves pending order and all seen work", () => {
  const frontier = new BfsFrontier();
  const first = {
    fromStateId: "state:first",
    interaction: interaction("first"),
    replayPath: {
      stateId: "state:first",
      steps: [],
    },
  };
  const second = {
    fromStateId: "state:second",
    interaction: interaction("second"),
    replayPath: {
      stateId: "state:second",
      steps: [],
    },
  };

  frontier.enqueue(first);
  frontier.enqueue(second);
  assert.equal(frontier.dequeue()?.interaction.id, "first");

  const restored = BfsFrontier.fromSnapshot(
    frontier.exportSnapshot(),
  );

  assert.equal(restored.size, 1);
  assert.equal(
    restored.hasSeen("state:first", "first"),
    true,
  );
  assert.equal(restored.enqueue(first), false);
  assert.equal(restored.dequeue()?.interaction.id, "second");
});

test("state graph snapshot round-trips semantic states and transitions", () => {
  const graph = new StateGraph(fingerprintState);
  const first = graph.upsertState(snapshot("First"));
  const second = graph.upsertState(snapshot("Second"));

  graph.addTransition({
    fromStateId: first.node.id,
    toStateId: second.node.id,
    interaction: interaction("advance"),
    status: "observed",
  });

  const exported = graph.exportSnapshot();
  const restored = StateGraph.fromSnapshot(
    exported,
    fingerprintState,
  );

  assert.equal(restored.stateCount, 2);
  assert.equal(restored.transitionCount, 1);
  assert.deepEqual(
    restored.exportSnapshot(),
    exported,
  );

  const tampered = {
    ...exported,
    states: exported.states.map((state, index) =>
      index === 0
        ? {
            ...state,
            fingerprint: {
              ...state.fingerprint,
              hash: "tampered",
            },
          }
        : state,
    ),
  };

  assert.throws(
    () =>
      StateGraph.fromSnapshot(
        tampered,
        fingerprintState,
      ),
    /fingerprint mismatch/,
  );
});

test("exploration checkpoint digest detects serialized corruption", () => {
  const graph = new StateGraph(fingerprintState);
  const root = graph.upsertState(snapshot("Root"));

  const artifact = createExplorationCheckpointArtifact({
    schemaVersion: 1,
    startUrl: "https://checkpoint.statescout.local/root",
    attemptedTransitions: 0,
    rootPath: {
      stateId: root.node.id,
      steps: [],
    },
    graph: graph.exportSnapshot(),
    frontier: new BfsFrontier().exportSnapshot(),
    evidenceErrors: [],
  });

  const serialized = serializeExplorationCheckpoint(artifact);
  const parsed = parseExplorationCheckpoint(serialized);

  assert.deepEqual(parsed, artifact);

  const tampered = JSON.parse(serialized) as {
    payload: { attemptedTransitions: number };
  };
  tampered.payload.attemptedTransitions = 99;

  assert.throws(
    () =>
      parseExplorationCheckpoint(
        JSON.stringify(tampered),
      ),
    /digest mismatch/,
  );
});
