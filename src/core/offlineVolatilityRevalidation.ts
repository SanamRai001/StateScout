import { createHash } from "node:crypto";

import {
  createVolatilityProfile,
  type ScopedVolatilityRule,
  type VolatilityProfile,
} from "./volatility.ts";
import {
  serializeFrozenVolatilityProfile,
  type FrozenVolatilityProfileArtifact,
} from "./offlineVolatilityPromotion.ts";
import {
  serializeRuleRevalidationEvidenceStore,
  type RuleRevalidationEvidenceStore,
} from "./volatilityRevalidationEvidenceStore.ts";

export interface RuleRevalidationPolicy {
  minBehaviorEvidence: number;
  minSessions: number;
  minDistinctValues: number;
}

export type RuleRevalidationStatus =
  | "retained"
  | "revoked"
  | "insufficient-evidence";

export interface RuleRevalidationDecision {
  rule: ScopedVolatilityRule;
  status: RuleRevalidationStatus;
  reasons: readonly string[];
  behaviorEvidenceCount: number;
  sessionCount: number;
  distinctValueCount: number;
  behaviorSignatureCount: number;
}

export interface FrozenVolatilityProfileRevisionArtifact {
  schemaVersion: 1;
  kind: "statescout-volatility-profile-revision";
  source: "offline-between-run-revalidation";
  parentProfileSha256: string;
  challengeEvidenceSha256: string;
  profile: VolatilityProfile;
  decisions: readonly RuleRevalidationDecision[];
}

export const DEFAULT_RULE_REVALIDATION_POLICY: RuleRevalidationPolicy = {
  minBehaviorEvidence: 4,
  minSessions: 2,
  minDistinctValues: 3,
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function assessTrustedVolatilityRule(
  rule: ScopedVolatilityRule,
  evidenceStore: RuleRevalidationEvidenceStore,
  policy: RuleRevalidationPolicy = DEFAULT_RULE_REVALIDATION_POLICY,
): RuleRevalidationDecision {
  const evidence = evidenceStore.records.filter(
    (record) =>
      record.field === rule.field &&
      record.sourceAnchorHash === rule.anchorHash,
  );

  const sessionCount = new Set(
    evidence.map((record) => record.sessionId),
  ).size;
  const distinctValueCount = new Set(
    evidence.map((record) => record.fieldValue),
  ).size;
  const behaviorSignatureCount = new Set(
    evidence.map((record) => record.behaviorSignature),
  ).size;

  const reasons: string[] = [];

  if (evidence.length < policy.minBehaviorEvidence) {
    reasons.push(
      `needs at least ${policy.minBehaviorEvidence} behavior confirmations`,
    );
  }

  if (sessionCount < policy.minSessions) {
    reasons.push(
      `needs evidence from at least ${policy.minSessions} sessions`,
    );
  }

  if (distinctValueCount < policy.minDistinctValues) {
    reasons.push(
      `needs at least ${policy.minDistinctValues} distinct field values`,
    );
  }

  if (reasons.length > 0) {
    return {
      rule,
      status: "insufficient-evidence",
      reasons,
      behaviorEvidenceCount: evidence.length,
      sessionCount,
      distinctValueCount,
      behaviorSignatureCount,
    };
  }

  if (behaviorSignatureCount > 1) {
    return {
      rule,
      status: "revoked",
      reasons: ["later safe probes produced divergent downstream behavior"],
      behaviorEvidenceCount: evidence.length,
      sessionCount,
      distinctValueCount,
      behaviorSignatureCount,
    };
  }

  return {
    rule,
    status: "retained",
    reasons: [],
    behaviorEvidenceCount: evidence.length,
    sessionCount,
    distinctValueCount,
    behaviorSignatureCount,
  };
}

export function buildRevalidatedVolatilityProfile(
  parentArtifact: FrozenVolatilityProfileArtifact,
  evidenceStore: RuleRevalidationEvidenceStore,
  policy: RuleRevalidationPolicy = DEFAULT_RULE_REVALIDATION_POLICY,
): FrozenVolatilityProfileRevisionArtifact {
  const decisions = parentArtifact.profile.rules.map((rule) =>
    assessTrustedVolatilityRule(rule, evidenceStore, policy),
  );

  const retainedRules = decisions
    .filter((decision) => decision.status !== "revoked")
    .map((decision) => decision.rule);

  return {
    schemaVersion: 1,
    kind: "statescout-volatility-profile-revision",
    source: "offline-between-run-revalidation",
    parentProfileSha256: sha256(
      serializeFrozenVolatilityProfile(parentArtifact),
    ),
    challengeEvidenceSha256: sha256(
      serializeRuleRevalidationEvidenceStore(evidenceStore),
    ),
    profile: createVolatilityProfile(retainedRules),
    decisions,
  };
}

export function serializeFrozenVolatilityProfileRevision(
  artifact: FrozenVolatilityProfileRevisionArtifact,
): string {
  return JSON.stringify(artifact, null, 2) + "\n";
}

export function parseFrozenVolatilityProfileRevision(
  serialized: string,
): FrozenVolatilityProfileRevisionArtifact {
  const parsed = JSON.parse(serialized) as Partial<FrozenVolatilityProfileRevisionArtifact>;

  if (
    parsed.schemaVersion !== 1 ||
    parsed.kind !== "statescout-volatility-profile-revision" ||
    parsed.source !== "offline-between-run-revalidation" ||
    typeof parsed.parentProfileSha256 !== "string" ||
    typeof parsed.challengeEvidenceSha256 !== "string" ||
    typeof parsed.profile !== "object" ||
    parsed.profile === null ||
    parsed.profile.version !== 1 ||
    !Array.isArray(parsed.profile.rules) ||
    !Array.isArray(parsed.decisions)
  ) {
    throw new Error("Unsupported or invalid frozen profile revision artifact.");
  }

  return parsed as FrozenVolatilityProfileRevisionArtifact;
}
