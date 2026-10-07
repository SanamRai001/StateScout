import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeState,
  fingerprintState,
} from "../../src/core/fingerprint.ts";
import type { SemanticStateSnapshot } from "../../src/core/model.ts";

const baseState: SemanticStateSnapshot = {
  origin: "https://example.test",
  path: "/orders",
  query: {},
  title: "Orders",
  headings: ["Orders"],
  landmarks: ["main"],
  dialogs: [],
  controls: [
    { role: "button", name: "Add order" },
    { role: "link", name: "Dashboard" },
  ],
};

test("equivalent semantic states produce the same fingerprint", () => {
  const reordered: SemanticStateSnapshot = {
    ...baseState,
    headings: ["   Orders   "],
    controls: [...baseState.controls].reverse(),
  };

  assert.equal(
    fingerprintState(baseState).hash,
    fingerprintState(reordered).hash,
  );
});

test("same route with a meaningful dialog produces a different fingerprint", () => {
  const withDialog: SemanticStateSnapshot = {
    ...baseState,
    dialogs: ["Add order"],
    controls: [
      ...baseState.controls,
      { role: "textbox", label: "Customer" },
      { role: "button", name: "Save" },
    ],
  };

  assert.notEqual(
    fingerprintState(baseState).hash,
    fingerprintState(withDialog).hash,
  );
});

test("query key ordering does not change the fingerprint", () => {
  const left: SemanticStateSnapshot = {
    ...baseState,
    query: { status: "open", table: "4" },
  };

  const right: SemanticStateSnapshot = {
    ...baseState,
    query: { table: "4", status: "open" },
  };

  assert.equal(fingerprintState(left).hash, fingerprintState(right).hash);
});

test("canonical state is deterministic", () => {
  assert.equal(canonicalizeState(baseState), canonicalizeState(baseState));
});
