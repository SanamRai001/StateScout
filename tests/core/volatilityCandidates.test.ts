import assert from "node:assert/strict";
import test from "node:test";

import type { SemanticStateSnapshot } from "../../src/core/model.ts";
import {
  assessVolatilityCandidate,
  discoverVolatilityCandidate,
  promoteVolatilityCandidate,
  type CandidateBehaviorEvidence,
} from "../../src/core/volatilityCandidates.ts";

const base: SemanticStateSnapshot = {
  origin: "https://fixture.statescout.test",
  path: "/dashboard",
  query: {},
  title: "Dashboard — A",
  headings: ["Dashboard"],
  landmarks: ["main"],
  dialogs: [],
  controls: [{ role: "button", name: "Inspect dashboard" }],
};

test("candidate remains ineligible with only one session", () => {
  const candidate = discoverVolatilityCandidate(
    [
      { sessionId: "session-a", snapshot: base },
      { sessionId: "session-a", snapshot: { ...base, title: "Dashboard — B" } },
      { sessionId: "session-a", snapshot: { ...base, title: "Dashboard — C" } },
      { sessionId: "session-a", snapshot: { ...base, title: "Dashboard — D" } },
    ],
    "title",
  );

  const behavior: CandidateBehaviorEvidence[] = [
    { sessionId: "session-a", fieldValue: "Dashboard — A", behaviorSignature: "same" },
    { sessionId: "session-a", fieldValue: "Dashboard — B", behaviorSignature: "same" },
    { sessionId: "session-a", fieldValue: "Dashboard — C", behaviorSignature: "same" },
    { sessionId: "session-a", fieldValue: "Dashboard — D", behaviorSignature: "same" },
  ];

  const assessment = assessVolatilityCandidate(candidate, behavior);
  assert.equal(assessment.eligible, false);
  assert.ok(
    assessment.reasons.includes("needs evidence from at least 2 sessions"),
  );
});

test("candidate promotion rejects divergent safe-probe behavior", () => {
  const candidate = discoverVolatilityCandidate(
    [
      { sessionId: "session-a", snapshot: base },
      { sessionId: "session-a", snapshot: { ...base, title: "Dashboard — B" } },
      { sessionId: "session-b", snapshot: { ...base, title: "Dashboard — C" } },
      { sessionId: "session-b", snapshot: { ...base, title: "Dashboard — D" } },
    ],
    "title",
  );

  const behavior: CandidateBehaviorEvidence[] = [
    { sessionId: "session-a", fieldValue: "Dashboard — A", behaviorSignature: "outcome-a" },
    { sessionId: "session-a", fieldValue: "Dashboard — B", behaviorSignature: "outcome-b" },
    { sessionId: "session-b", fieldValue: "Dashboard — C", behaviorSignature: "outcome-a" },
    { sessionId: "session-b", fieldValue: "Dashboard — D", behaviorSignature: "outcome-b" },
  ];

  assert.throws(
    () => promoteVolatilityCandidate(candidate, behavior),
    /divergent downstream behavior/,
  );
});
