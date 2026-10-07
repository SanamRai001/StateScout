import type { SemanticStateSnapshot } from "./model.ts";
import {
  volatilityAnchorHash,
  type ScopedVolatilityRule,
  type VolatilityField,
} from "./volatility.ts";

export interface CandidateObservation {
  sessionId: string;
  snapshot: SemanticStateSnapshot;
}

export interface CandidateBehaviorEvidence {
  sessionId: string;
  fieldValue: string;
  behaviorSignature: string;
}

export interface VolatilityCandidate {
  field: VolatilityField;
  anchorHash: string;
  observationCount: number;
  sessionIds: readonly string[];
  distinctValues: readonly string[];
  status: "quarantined";
}

export interface CandidatePromotionPolicy {
  minObservations: number;
  minSessions: number;
  minDistinctValues: number;
  minBehaviorEvidence: number;
}

export interface CandidateAssessment {
  eligible: boolean;
  reasons: readonly string[];
  observationCount: number;
  sessionCount: number;
  distinctValueCount: number;
  behaviorEvidenceCount: number;
  behaviorSignatureCount: number;
}

export const DEFAULT_CANDIDATE_PROMOTION_POLICY: CandidatePromotionPolicy = {
  minObservations: 4,
  minSessions: 2,
  minDistinctValues: 3,
  minBehaviorEvidence: 4,
};

function normalizeText(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() || "<absent>";
}

export function volatilityFieldValue(
  snapshot: SemanticStateSnapshot,
  field: VolatilityField,
): string {
  if (field === "title") {
    return normalizeText(snapshot.title);
  }

  const requested = field.slice("query:".length).toLowerCase();
  const match = Object.entries(snapshot.query).find(
    ([key]) => key.toLowerCase() === requested,
  );

  if (!match) return "<absent>";
  const [, value] = match;
  return typeof value === "string"
    ? value
    : JSON.stringify([...value].sort());
}

export function discoverVolatilityCandidate(
  observations: readonly CandidateObservation[],
  field: VolatilityField,
): VolatilityCandidate {
  if (observations.length < 2) {
    throw new Error("Candidate discovery requires at least two observations.");
  }

  const anchors = observations.map(({ snapshot }) =>
    volatilityAnchorHash(snapshot, field),
  );
  const uniqueAnchors = new Set(anchors);

  if (uniqueAnchors.size !== 1) {
    throw new Error(
      `Cannot discover candidate for ${field}: protected semantic anchor changed.`,
    );
  }

  const distinctValues = [
    ...new Set(
      observations.map(({ snapshot }) => volatilityFieldValue(snapshot, field)),
    ),
  ].sort();

  if (distinctValues.length < 2) {
    throw new Error(
      `Cannot discover candidate for ${field}: field did not vary.`,
    );
  }

  return {
    field,
    anchorHash: anchors[0]!,
    observationCount: observations.length,
    sessionIds: [...new Set(observations.map(({ sessionId }) => sessionId)].sort(),
    distinctValues,
    status: "quarantined",
  };
}

export function assessVolatilityCandidate(
  candidate: VolatilityCandidate,
  behaviorEvidence: readonly CandidateBehaviorEvidence[],
  policy: CandidatePromotionPolicy = DEFAULT_CANDIDATE_PROMOTION_POLICY,
): CandidateAssessment {
  const reasons: string[] = [];

  if (candidate.observationCount < policy.minObservations) {
    reasons.push(
      `needs at least ${policy.minObservations} observations`,
    );
  }

  if (candidate.sessionIds.length < policy.minSessions) {
    reasons.push(
      `needs evidence from at least ${policy.minSessions} sessions`,
    );
  }

  if (candidate.distinctValues.length < policy.minDistinctValues) {
    reasons.push(
      `needs at least ${policy.minDistinctValues} distinct field values`,
    );
  }

  if (behaviorEvidence.length < policy.minBehaviorEvidence) {
    reasons.push(
      `needs at least ${policy.minBehaviorEvidence} behavior confirmations`,
    );
  }

  const behaviorSessions = new Set(
    behaviorEvidence.map((evidence) => evidence.sessionId),
  );
  if (behaviorSessions.size < policy.minSessions) {
    reasons.push(
      `behavior evidence needs at least ${policy.minSessions} sessions`,
    );
  }

  const behaviorSignatures = new Set(
    behaviorEvidence.map((evidence) => evidence.behaviorSignature),
  );
  if (behaviorSignatures.size > 1) {
    reasons.push("safe probe produced divergent downstream behavior");
  }

  const behaviorValues = new Set(
    behaviorEvidence.map((evidence) => evidence.fieldValue),
  );
  if (behaviorValues.size < policy.minDistinctValues) {
    reasons.push(
      `behavior evidence needs at least ${policy.minDistinctValues} distinct field values`,
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    observationCount: candidate.observationCount,
    sessionCount: candidate.sessionIds.length,
    distinctValueCount: candidate.distinctValues.length,
    behaviorEvidenceCount: behaviorEvidence.length,
    behaviorSignatureCount: behaviorSignatures.size,
  };
}

export function promoteVolatilityCandidate(
  candidate: VolatilityCandidate,
  behaviorEvidence: readonly CandidateBehaviorEvidence[],
  policy: CandidatePromotionPolicy = DEFAULT_CANDIDATE_PROMOTION_POLICY,
): ScopedVolatilityRule {
  const assessment = assessVolatilityCandidate(
    candidate,
    behaviorEvidence,
    policy,
  );

  if (!assessment.eligible) {
    throw new Error(
      `Volatility candidate cannot be promoted: ${assessment.reasons.join("; ")}`,
    );
  }

  return {
    field: candidate.field,
    anchorHash: candidate.anchorHash,
    sampleCount: candidate.observationCount,
    distinctValues: candidate.distinctValues,
    provenance: "verified-candidate-promotion",
  };
}
