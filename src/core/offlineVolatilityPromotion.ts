import { createHash } from "node:crypto";

import {
  assessVolatilityCandidate,
  promoteVolatilityCandidate,
  type CandidateAssessment,
  type VolatilityCandidate,
} from "./volatilityCandidates.ts";
import {
  createVolatilityProfile,
  type VolatilityProfile,
} from "./volatility.ts";
import type { VolatilityBehaviorEvidenceStore } from "./volatilityBehaviorEvidenceStore.ts";
import {
  discoverQuarantinedCandidates,
  serializeVolatilityEvidenceStore,
  type VolatilityEvidenceStore,
} from "./volatilityEvidenceStore.ts";

export interface OfflinePromotionDecision {
  candidate: VolatilityCandidate;
  assessment: CandidateAssessment;
  promoted: boolean;
}

export interface FrozenVolatilityProfileArtifact {
  schemaVersion: 1;
  kind: "statescout-volatility-profile";
  source: "offline-between-run-promotion";
  observationEvidenceSha256: string;
  behaviorEvidenceSha256: string;
  profile: VolatilityProfile;
  decisions: readonly OfflinePromotionDecision[];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function behaviorStoreCanonical(
  store: VolatilityBehaviorEvidenceStore,
): string {
  return JSON.stringify(store, null, 2) + "\n";
}

export function buildOfflineVolatilityProfile(
  observationStore: VolatilityEvidenceStore,
  behaviorStore: VolatilityBehaviorEvidenceStore,
): FrozenVolatilityProfileArtifact {
  const candidates = discoverQuarantinedCandidates(observationStore);
  const decisions: OfflinePromotionDecision[] = [];
  const promotedRules = [];

  for (const candidate of candidates) {
    const relevantBehavior = behaviorStore.records.filter(
      (record) =>
        record.sourceAnchorHash === candidate.anchorHash &&
        candidate.distinctValues.includes(record.fieldValue),
    );

    const assessment = assessVolatilityCandidate(
      candidate,
      relevantBehavior,
    );

    if (assessment.eligible) {
      promotedRules.push(
        promoteVolatilityCandidate(candidate, relevantBehavior),
      );
    }

    decisions.push({
      candidate,
      assessment,
      promoted: assessment.eligible,
    });
  }

  return {
    schemaVersion: 1,
    kind: "statescout-volatility-profile",
    source: "offline-between-run-promotion",
    observationEvidenceSha256: sha256(
      serializeVolatilityEvidenceStore(observationStore),
    ),
    behaviorEvidenceSha256: sha256(
      behaviorStoreCanonical(behaviorStore),
    ),
    profile: createVolatilityProfile(promotedRules),
    decisions,
  };
}

export function serializeFrozenVolatilityProfile(
  artifact: FrozenVolatilityProfileArtifact,
): string {
  return JSON.stringify(artifact, null, 2) + "\n";
}

export function parseFrozenVolatilityProfile(
  serialized: string,
): FrozenVolatilityProfileArtifact {
  const parsed = JSON.parse(serialized) as Partial<FrozenVolatilityProfileArtifact>;

  if (
    parsed.schemaVersion !== 1 ||
    parsed.kind !== "statescout-volatility-profile" ||
    parsed.source !== "offline-between-run-promotion" ||
    typeof parsed.observationEvidenceSha256 !== "string" ||
    typeof parsed.behaviorEvidenceSha256 !== "string" ||
    typeof parsed.profile !== "object" ||
    parsed.profile === null ||
    parsed.profile.version !== 1 ||
    !Array.isArray(parsed.profile.rules) ||
    !Array.isArray(parsed.decisions)
  ) {
    throw new Error("Unsupported or invalid frozen volatility profile artifact.");
  }

  return parsed as FrozenVolatilityProfileArtifact;
}
