import { performance } from "node:perf_hooks";

import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import type { EquivalenceCase } from "./cases.ts";

type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;

export interface EquivalenceCaseResult {
  id: string;
  expected: "same" | "different";
  predicted: "same" | "different";
  correct: boolean;
  durationMs: number;
}

export interface EquivalenceMetrics {
  total: number;
  correct: number;
  accuracy: number;
  samePrecision: number;
  sameRecall: number;
  sameF1: number;
  falseMergeCount: number;
  falseSplitCount: number;
  falseMergeRate: number;
  falseSplitRate: number;
  meanFingerprintPairMs: number;
  cases: readonly EquivalenceCaseResult[];
}

export function evaluateEquivalence(
  cases: readonly EquivalenceCase[],
  fingerprinter: Fingerprinter = fingerprintState,
): EquivalenceMetrics {
  const results = cases.map((candidate): EquivalenceCaseResult => {
    const start = performance.now();
    const left = fingerprinter(candidate.left);
    const right = fingerprinter(candidate.right);
    const durationMs = performance.now() - start;
    const predicted = left.hash === right.hash ? "same" : "different";
    return { id: candidate.id, expected: candidate.label, predicted, correct: predicted === candidate.label, durationMs };
  });

  const sameCases = results.filter((item) => item.expected === "same");
  const differentCases = results.filter((item) => item.expected === "different");
  const predictedSame = results.filter((item) => item.predicted === "same");
  const trueSame = results.filter((item) => item.expected === "same" && item.predicted === "same").length;
  const falseMergeCount = results.filter((item) => item.expected === "different" && item.predicted === "same").length;
  const falseSplitCount = results.filter((item) => item.expected === "same" && item.predicted === "different").length;
  const samePrecision = predictedSame.length === 0 ? 0 : trueSame / predictedSame.length;
  const sameRecall = sameCases.length === 0 ? 0 : trueSame / sameCases.length;
  const sameF1 = samePrecision + sameRecall === 0 ? 0 : (2 * samePrecision * sameRecall) / (samePrecision + sameRecall);

  return {
    total: results.length,
    correct: results.filter((item) => item.correct).length,
    accuracy: results.filter((item) => item.correct).length / results.length,
    samePrecision,
    sameRecall,
    sameF1,
    falseMergeCount,
    falseSplitCount,
    falseMergeRate: differentCases.length === 0 ? 0 : falseMergeCount / differentCases.length,
    falseSplitRate: sameCases.length === 0 ? 0 : falseSplitCount / sameCases.length,
    meanFingerprintPairMs: results.reduce((sum, item) => sum + item.durationMs, 0) / results.length,
    cases: results,
  };
}
