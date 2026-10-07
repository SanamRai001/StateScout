import assert from "node:assert/strict";
import test from "node:test";
import type { FrozenVolatilityProfileArtifact } from "../../src/core/offlineVolatilityPromotion.ts";
import { DEFAULT_RULE_REVALIDATION_POLICY } from "../../src/core/offlineVolatilityRevalidation.ts";
import { createVolatilityProfile, type ScopedVolatilityRule } from "../../src/core/volatility.ts";
import { createRuleRevalidationEvidenceStore } from "../../src/core/volatilityRevalidationEvidenceStore.ts";
import {
  advanceTrustLifecycle,
  initializeTrustLifecycle,
  materializeActiveProfile,
  type RuleEvidenceWindow,
  type TrustLifecyclePolicy,
} from "../../src/core/volatilityTrustLifecycle.ts";

const DAY = 24 * 60 * 60 * 1000;
const policy: TrustLifecyclePolicy = {
  maxTrustAgeMs: 3 * DAY,
  maxEvidenceAgeMs: DAY,
  conflictWindowsToRevoke: 2,
  stableWindowsToRestore: 2,
  revalidation: DEFAULT_RULE_REVALIDATION_POLICY,
};
const rule: ScopedVolatilityRule = {
  field: "title",
  anchorHash: "anchor",
  sampleCount: 8,
  distinctValues: ["a", "b", "c", "d"],
  provenance: "verified-candidate-promotion",
};
const parent: FrozenVolatilityProfileArtifact = {
  schemaVersion: 1,
  kind: "statescout-volatility-profile",
  source: "offline-between-run-promotion",
  observationEvidenceSha256: "0".repeat(64),
  behaviorEvidenceSha256: "1".repeat(64),
  profile: createVolatilityProfile([rule]),
  decisions: [],
};

function window(id: string, signatures: readonly string[], observedAt: string, scope = "app:v1"): RuleEvidenceWindow {
  return {
    windowId: id,
    applicationScope: scope,
    observedAt,
    evidence: createRuleRevalidationEvidenceStore(
      signatures.map((behaviorSignature, index) => ({
        sessionId: index < 2 ? "a" : "b",
        field: "title",
        sourceAnchorHash: "anchor",
        fieldValue: String(index + 1),
        behaviorSignature,
      })),
    ),
  };
}

test("duplicate challenge windows cannot escalate a rule to revoked", () => {
  const initial = initializeTrustLifecycle(parent, "app:v1", "2026-01-01T00:00:00.000Z", policy);
  const conflict = window("conflict-a", ["x", "y", "x", "y"], "2026-01-02T00:00:00.000Z");
  const challenged = advanceTrustLifecycle(initial, conflict, "2026-01-02T01:00:00.000Z");
  const duplicate = advanceTrustLifecycle(challenged, conflict, "2026-01-02T02:00:00.000Z");
  assert.equal(challenged.entries[0]?.state, "challenged");
  assert.equal(duplicate.entries[0]?.state, "challenged");
  assert.equal(duplicate.decisions[0]?.status, "duplicate-window");
});

test("persistent conflict revokes and two stable windows restore trust", () => {
  const initial = initializeTrustLifecycle(parent, "app:v1", "2026-01-01T00:00:00.000Z", policy);
  const challenged = advanceTrustLifecycle(initial, window("c1", ["x", "y", "x", "y"], "2026-01-02T00:00:00.000Z"), "2026-01-02T01:00:00.000Z");
  const revoked = advanceTrustLifecycle(challenged, window("c2", ["x", "y", "x", "y"], "2026-01-03T00:00:00.000Z"), "2026-01-03T01:00:00.000Z");
  const cooldown = advanceTrustLifecycle(revoked, window("s1", ["z", "z", "z", "z"], "2026-01-04T00:00:00.000Z"), "2026-01-04T01:00:00.000Z");
  const restored = advanceTrustLifecycle(cooldown, window("s2", ["z", "z", "z", "z"], "2026-01-05T00:00:00.000Z"), "2026-01-05T01:00:00.000Z");
  assert.equal(revoked.entries[0]?.state, "revoked");
  assert.equal(cooldown.entries[0]?.state, "cooldown");
  assert.equal(restored.entries[0]?.state, "trusted");
});

test("stale trust and scope mismatch keep rules out of the active profile", () => {
  const initial = initializeTrustLifecycle(parent, "app:v1", "2026-01-01T00:00:00.000Z", policy);
  assert.equal(materializeActiveProfile(initial, "app:v2", "2026-01-01T01:00:00.000Z").profile.rules.length, 0);
  assert.equal(materializeActiveProfile(initial, "app:v1", "2026-01-10T00:00:00.000Z").profile.rules.length, 0);
  const stale = advanceTrustLifecycle(
    initial,
    window("old", ["z", "z", "z", "z"], "2026-01-01T00:00:00.000Z"),
    "2026-01-04T00:00:00.000Z",
  );
  assert.equal(stale.decisions[0]?.status, "stale-evidence");
});
