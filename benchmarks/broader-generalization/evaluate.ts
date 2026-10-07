import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import { BROADER_GENERALIZATION_CASES } from "./groundTruth.ts";

type ExpectedRelation = "same" | "different";
type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;
type GroundTruthCase = (typeof BROADER_GENERALIZATION_CASES)[number];

interface ObservedPair {
  candidate: GroundTruthCase;
  left: SemanticStateSnapshot;
  right: SemanticStateSnapshot;
}

export interface BroaderGeneralizationMetrics {
  total: number;
  correct: number;
  falseMerges: number;
  falseSplits: number;
  cases: readonly {
    id: string;
    expected: ExpectedRelation;
    predicted: ExpectedRelation;
    correct: boolean;
    rationale: string;
  }[];
}

async function snapshot(
  page: Page,
  baseUrl: string,
  suffix: string,
): Promise<SemanticStateSnapshot> {
  await page.goto(baseUrl + suffix);
  await page.reload();
  return observePage(page);
}

export async function evaluateBroaderGeneralization(
  page: Page,
  baseUrl: string,
) {
  const pairs: ObservedPair[] = [];

  for (const candidate of BROADER_GENERALIZATION_CASES) {
    pairs.push({
      candidate,
      left: await snapshot(page, baseUrl, candidate.left),
      right: await snapshot(page, baseUrl, candidate.right),
    });
  }

  const evaluate = (
    fingerprinter: Fingerprinter,
  ): BroaderGeneralizationMetrics => {
    const cases: BroaderGeneralizationMetrics["cases"][number][] = pairs.map(
      ({ candidate, left, right }) => {
        const predicted: ExpectedRelation =
          fingerprinter(left).hash === fingerprinter(right).hash
            ? "same"
            : "different";

        return {
          id: candidate.id,
          expected: candidate.expected,
          predicted,
          correct: predicted === candidate.expected,
          rationale: candidate.rationale,
        };
      },
    );

    return {
      total: cases.length,
      correct: cases.filter((item) => item.correct).length,
      falseMerges: cases.filter(
        (item) => item.expected === "different" && item.predicted === "same",
      ).length,
      falseSplits: cases.filter(
        (item) => item.expected === "same" && item.predicted === "different",
      ).length,
      cases,
    };
  };

  return {
    v1: evaluate(fingerprintState),
    v2: evaluate(fingerprintStateV2),
    v3: evaluate(fingerprintStateV3),
  };
}
