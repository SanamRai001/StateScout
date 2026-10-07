import assert from "node:assert/strict";
import test from "node:test";

import { BfsFrontier } from "../../src/core/frontier.ts";
import type { FrontierItem } from "../../src/core/frontier.ts";
import type { Interaction } from "../../src/core/model.ts";

function interaction(id: string): Interaction {
  return {
    id,
    kind: "click",
    risk: "safe",
    target: { role: "button", name: id },
    locatorCandidates: [],
  };
}

function item(stateId: string, interactionId: string): FrontierItem {
  return {
    fromStateId: stateId,
    interaction: interaction(interactionId),
    replayPath: {
      stateId,
      steps: [],
    },
  };
}

test("frontier is FIFO", () => {
  const frontier = new BfsFrontier();

  frontier.enqueue(item("state-a", "one"));
  frontier.enqueue(item("state-a", "two"));

  assert.equal(frontier.dequeue()?.interaction.id, "one");
  assert.equal(frontier.dequeue()?.interaction.id, "two");
});

test("frontier deduplicates state and interaction pairs", () => {
  const frontier = new BfsFrontier();

  assert.equal(frontier.enqueue(item("state-a", "open")), true);
  assert.equal(frontier.enqueue(item("state-a", "open")), false);
  assert.equal(frontier.enqueue(item("state-b", "open")), true);

  assert.equal(frontier.size, 2);
});
