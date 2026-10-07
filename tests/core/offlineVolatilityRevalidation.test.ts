import assert from "node:assert/strict";
import test from "node:test";

import {
  assessTrustedVolatilityRule,
} from "../../src/core/offlineVolatilityRevalidation.ts";
import type { ScopedVolatilityRule } from "../../src/core/volatility.ts";
import {
  createRuleRevalidationEvidenceStore,
} from "../../src/core/volatilityRevalidationEvidenceStore.ts";

const rule: ScopedVolatilityRule = {
  field: "title",
  anchorHash: "anchor-dashboard",
  sampleCount: 8,
  distinctValues: [
    "Dashboard — refresh 1",
    "Dashboard — refresh 2",
    "Dashboard — refresh 3",
    "Dashboard — refresh 4",
  ],
  provenance: "verified-candidate-promotion",
};

test("revalidation retains a rule when later safe behavior remains stable", () => {
  const evidence = createRuleRevalidationEvidenceStore([
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 5", behaviorSignature: "same" },
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 6", behaviorSignature: "same" },
    { sessionId: "b", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 7", behaviorSignature: "same" },
    { sessionId: "b", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 8", behaviorSignature: "same" },
  ]);

  const decision = assessTrustedVolatilityRule(rule, evidence);
  assert.equal(decision.status, "retained");
  assert.equal(decision.behaviorSignatureCount, 1);
});

test("revalidation revokes a rule when later safe behavior diverges", () => {
  const evidence = createRuleRevalidationEvidenceStore([
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 5", behaviorSignature: "normal" },
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 6", behaviorSignature: "priority" },
    { sessionId: "b", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 7", behaviorSignature: "normal" },
    { sessionId: "b", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 8", behaviorSignature: "priority" },
  ]);

  const decision = assessTrustedVolatilityRule(rule, evidence);
  assert.equal(decision.status, "revoked");
  assert.equal(decision.behaviorSignatureCount, 2);
});

test("insufficient later evidence does not revoke a trusted rule", () => {
  const evidence = createRuleRevalidationEvidenceStore([
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 5", behaviorSignature: "normal" },
    { sessionId: "a", field: "title", sourceAnchorHash: "anchor-dashboard", fieldValue: "Dashboard — refresh 6", behaviorSignature: "priority" },
  ]);

  const decision = assessTrustedVolatilityRule(rule, evidence);
  assert.equal(decision.status, "insufficient-evidence");
  assert.ok(decision.reasons.length > 0);
});

test("revalidation evidence for another field or anchor cannot challenge the rule", () => {
  const evidence = createRuleRevalidationEvidenceStore([
    { sessionId: "a", field: "query:token", sourceAnchorHash: "anchor-dashboard", fieldValue: "5", behaviorSignature: "a" },
    { sessionId: "a", field: "title", sourceAnchorHash: "other-anchor", fieldValue: "Dashboard — refresh 6", behaviorSignature: "b" },
    { sessionId: "b", field: "title", sourceAnchorHash: "other-anchor", fieldValue: "Dashboard — refresh 7", behaviorSignature: "a" },
    { sessionId: "b", field: "title", sourceAnchorHash: "other-anchor", fieldValue: "Dashboard — refresh 8", behaviorSignature: "b" },
  ]);

  const decision = assessTrustedVolatilityRule(rule, evidence);
  assert.equal(decision.status, "insufficient-evidence");
  assert.equal(decision.behaviorEvidenceCount, 0);
});
