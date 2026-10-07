import {
  scheduleSelectiveRevalidation,
  type RuleRevalidationImpact,
} from "../../src/core/selectiveRevalidationScheduler.ts";
import {
  advanceTrustLifecycle,
  type FrozenTrustLifecycleArtifact,
  type RuleTrustEntry,
} from "../../src/core/volatilityTrustLifecycle.ts";
import {
  createRuleRevalidationEvidenceStore,
} from "../../src/core/volatilityRevalidationEvidenceStore.ts";
import type { ScopedVolatilityRule } from "../../src/core/volatility.ts";
import { DEFAULT_RULE_REVALIDATION_POLICY } from "../../src/core/offlineVolatilityRevalidation.ts";
import { SELECTIVE_REVALIDATION_GROUND_TRUTH } from "./groundTruth.ts";

const DAY = 24 * 60 * 60 * 1000;

function rule(
  field: ScopedVolatilityRule["field"],
  anchorHash: string,
): ScopedVolatilityRule {
  return {
    field,
    anchorHash,
    sampleCount: 8,
    distinctValues: ["v1", "v2", "v3", "v4"],
    provenance: "verified-candidate-promotion",
  };
}

function entry(
  scopedRule: ScopedVolatilityRule,
  state: RuleTrustEntry["state"],
  lastVerifiedAt: string,
  conflictWindows = 0,
  stableWindows = 0,
): RuleTrustEntry {
  return {
    rule: scopedRule,
    state,
    applicationScope:
      SELECTIVE_REVALIDATION_GROUND_TRUTH.applicationScope,
    lastVerifiedAt,
    consecutiveConflictWindows: conflictWindows,
    consecutiveStableWindows: stableWindows,
  };
}

export function createSelectiveRevalidationFixture():
  FrozenTrustLifecycleArtifact {
  return {
    schemaVersion: 1,
    kind: "statescout-volatility-trust-lifecycle",
    source: "offline-between-run-lifecycle",
    applicationScope:
      SELECTIVE_REVALIDATION_GROUND_TRUTH.applicationScope,
    parentArtifactSha256: "0".repeat(64),
    generatedAt: "2026-01-09T12:00:00.000Z",
    policy: {
      maxTrustAgeMs:
        SELECTIVE_REVALIDATION_GROUND_TRUTH.maxTrustAgeMs,
      maxEvidenceAgeMs: 2 * DAY,
      conflictWindowsToRevoke: 2,
      stableWindowsToRestore: 2,
      revalidation: DEFAULT_RULE_REVALIDATION_POLICY,
    },
    entries: [
      entry(
        rule("title", "anchor-challenged-critical"),
        "challenged",
        "2026-01-09T12:00:00.000Z",
        1,
      ),
      entry(
        rule("query:refreshToken", "anchor-trusted-aging"),
        "trusted",
        "2026-01-01T12:00:00.000Z",
      ),
      entry(
        rule("title", "anchor-cooldown-medium"),
        "cooldown",
        "2026-01-09T12:00:00.000Z",
        2,
        1,
      ),
      entry(
        rule("query:sessionNoise", "anchor-trusted-fresh-low"),
        "trusted",
        "2026-01-09T12:00:00.000Z",
      ),
    ],
    processedWindowIds: [],
    decisions: [],
  };
}

export function selectiveRevalidationImpacts():
  readonly RuleRevalidationImpact[] {
  return SELECTIVE_REVALIDATION_GROUND_TRUTH.ranking.map(
    ({ anchorHash, estimatedAffectedStates }) => {
      const fixture = createSelectiveRevalidationFixture();
      const matching = fixture.entries.find(
        (candidate) => candidate.rule.anchorHash === anchorHash,
      );

      if (!matching) {
        throw new Error(`Unknown frozen rule anchor: ${anchorHash}`);
      }

      return {
        field: matching.rule.field,
        anchorHash,
        estimatedAffectedStates,
      };
    },
  );
}

function stateByAnchor(
  artifact: FrozenTrustLifecycleArtifact,
  anchorHash: string,
): RuleTrustEntry["state"] | undefined {
  return artifact.entries.find(
    (entry) => entry.rule.anchorHash === anchorHash,
  )?.state;
}

export function evaluateSelectiveRevalidation() {
  const artifact = createSelectiveRevalidationFixture();
  const plan = scheduleSelectiveRevalidation(
    artifact,
    selectiveRevalidationImpacts(),
    SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
    SELECTIVE_REVALIDATION_GROUND_TRUTH.budget,
  );

  const selectedAnchor = plan.selected[0]?.anchorHash;
  if (selectedAnchor !== "anchor-challenged-critical") {
    throw new Error("Frozen highest-priority rule was not selected first.");
  }

  const stableEvidence = createRuleRevalidationEvidenceStore([
    {
      sessionId: "phase15-stable-a",
      field: "title",
      sourceAnchorHash: selectedAnchor,
      fieldValue: "v5",
      behaviorSignature: "stable-details",
    },
    {
      sessionId: "phase15-stable-a",
      field: "title",
      sourceAnchorHash: selectedAnchor,
      fieldValue: "v6",
      behaviorSignature: "stable-details",
    },
    {
      sessionId: "phase15-stable-b",
      field: "title",
      sourceAnchorHash: selectedAnchor,
      fieldValue: "v7",
      behaviorSignature: "stable-details",
    },
    {
      sessionId: "phase15-stable-b",
      field: "title",
      sourceAnchorHash: selectedAnchor,
      fieldValue: "v8",
      behaviorSignature: "stable-details",
    },
  ]);

  const afterSelectedEvidence = advanceTrustLifecycle(
    artifact,
    {
      windowId: "phase15-selected-challenged-stable",
      applicationScope:
        SELECTIVE_REVALIDATION_GROUND_TRUTH.applicationScope,
      observedAt: "2026-01-10T11:00:00.000Z",
      evidence: stableEvidence,
    },
    SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
  );

  return {
    plan,
    selectedFraction:
      artifact.entries.length === 0
        ? 0
        : plan.selected.length / artifact.entries.length,
    savedRuleProbes: artifact.entries.length - plan.selected.length,
    statesBefore: Object.fromEntries(
      artifact.entries.map((entry) => [
        entry.rule.anchorHash,
        entry.state,
      ]),
    ),
    statesAfterSelectedEvidence: Object.fromEntries(
      artifact.entries.map((entry) => [
        entry.rule.anchorHash,
        stateByAnchor(
          afterSelectedEvidence,
          entry.rule.anchorHash,
        ),
      ]),
    ),
    selectedDecision:
      afterSelectedEvidence.decisions.find(
        (decision) =>
          decision.rule.anchorHash === selectedAnchor,
      ),
    untouchedDecisions:
      afterSelectedEvidence.decisions.filter(
        (decision) =>
          decision.rule.anchorHash !== selectedAnchor,
      ),
  };
}
