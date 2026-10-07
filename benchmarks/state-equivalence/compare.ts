import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { STATE_EQUIVALENCE_CASES } from "./cases.ts";
import { evaluateEquivalence, type EquivalenceMetrics } from "./evaluate.ts";

type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;

export interface FingerprintComparison {
  v1: EquivalenceMetrics;
  v2: EquivalenceMetrics;
  delta: {
    accuracy: number;
    sameF1: number;
    falseMergeCount: number;
    falseSplitCount: number;
  };
}

export function compareFingerprints(): FingerprintComparison {
  const v1 = evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintState);
  const v2 = evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintStateV2);
  return {
    v1,
    v2,
    delta: {
      accuracy: v2.accuracy - v1.accuracy,
      sameF1: v2.sameF1 - v1.sameF1,
      falseMergeCount: v2.falseMergeCount - v1.falseMergeCount,
      falseSplitCount: v2.falseSplitCount - v1.falseSplitCount,
    },
  };
}
