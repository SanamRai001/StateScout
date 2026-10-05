import assert from "node:assert/strict";
import test from "node:test";

import type { Interaction } from "../../src/core/model.js";
import {
  canExecuteInteraction,
  classifyInteractionRisk,
  DEFAULT_ACTION_POLICY,
  isUrlAllowed,
} from "../../src/core/policy.js";

test("same-origin boundary allows internal URLs", () => {
  const policy = {
    mode: "same-origin" as const,
    startUrl: "https://example.test/app",
  };

  assert.equal(isUrlAllowed("/orders", policy), true);
  assert.equal(isUrlAllowed("https://example.test/settings", policy), true);
});

test("same-origin boundary blocks external and non-http URLs", () => {
  const policy = {
    mode: "same-origin" as const,
    startUrl: "https://example.test",
  };

  assert.equal(isUrlAllowed("https://other.test", policy), false);
  assert.equal(isUrlAllowed("mailto:test@example.test", policy), false);
});

test("risk classifier separates safe, mutating, and destructive controls", () => {
  assert.equal(
    classifyInteractionRisk({ role: "button", name: "Open filters" }),
    "safe",
  );
  assert.equal(
    classifyInteractionRisk({ role: "button", name: "Create order" }),
    "mutating",
  );
  assert.equal(
    classifyInteractionRisk({ role: "button", name: "Delete order" }),
    "destructive",
  );
});

test("default action policy only executes safe interactions", () => {
  const interaction = (risk: Interaction["risk"]): Interaction => ({
    id: `interaction-${risk}`,
    kind: "click",
    risk,
    target: { role: "button", name: risk },
    locatorCandidates: [],
  });

  assert.equal(canExecuteInteraction(interaction("safe")), true);
  assert.equal(
    canExecuteInteraction(interaction("mutating"), DEFAULT_ACTION_POLICY),
    false,
  );
  assert.equal(
    canExecuteInteraction(interaction("destructive"), DEFAULT_ACTION_POLICY),
    false,
  );
  assert.equal(
    canExecuteInteraction(interaction("unknown"), DEFAULT_ACTION_POLICY),
    false,
  );
});
