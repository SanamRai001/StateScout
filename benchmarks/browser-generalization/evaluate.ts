import type { Page } from "playwright";

import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { BROWSER_GENERALIZATION_GROUND_TRUTH } from "./groundTruth.ts";

type ExpectedRelation = "same" | "different";
type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;
type GroundTruthCase = (typeof BROWSER_GENERALIZATION_GROUND_TRUTH)[number];

interface ObservedPair {
  candidate: GroundTruthCase;
  left: SemanticStateSnapshot;
  right: SemanticStateSnapshot;
}

export interface BrowserAlgorithmMetrics {
  correct: number;
  total: number;
  falseMerges: number;
  falseSplits: number;
  cases: readonly {
    id: string;
    expected: ExpectedRelation;
    predicted: ExpectedRelation;
    correct: boolean;
  }[];
}

async function snapshot(page: Page, baseUrl: string, suffix: string): Promise<SemanticStateSnapshot> {
  await page.goto(baseUrl + suffix);
  // Hash-only navigation is same-document navigation and does not rerun the fixture
  // script. Reload so every observation is rendered from its complete target URL.
  await page.reload();
  return observePage(page);
}

export async function evaluateBrowserGeneralization(page: Page, baseUrl: string) {
  const pairs: ObservedPair[] = [];
  for (const candidate of BROWSER_GENERALIZATION_GROUND_TRUTH) {
    pairs.push({
      candidate,
      left: await snapshot(page, baseUrl, candidate.left),
      right: await snapshot(page, baseUrl, candidate.right),
    });
  }

  const evaluate = (fingerprinter: Fingerprinter): BrowserAlgorithmMetrics => {
    const cases: BrowserAlgorithmMetrics["cases"][number][] = pairs.map(({ candidate, left, right }) => {
      const predicted: ExpectedRelation =
        fingerprinter(left).hash === fingerprinter(right).hash ? "same" : "different";
      return {
        id: candidate.id,
        expected: candidate.expected,
        predicted,
        correct: predicted === candidate.expected,
      };
    });

    return {
      correct: cases.filter((item) => item.correct).length,
      total: cases.length,
      falseMerges: cases.filter((item) => item.expected === "different" && item.predicted === "same").length,
      falseSplits: cases.filter((item) => item.expected === "same" && item.predicted === "different").length,
      cases,
    };
  };

  return {
    v1: evaluate(fingerprintState),
    v2: evaluate(fingerprintStateV2),
    v3: evaluate(fingerprintStateV3),
  };
}
