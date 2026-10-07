import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import type { SemanticStateSnapshot, StateFingerprint } from "../../src/core/model.ts";
import {
  createVolatilityProfile,
  learnScopedVolatilityRule,
} from "../../src/core/volatility.ts";
import { OBSERVED_VOLATILITY_EVALUATION_CASES } from "./groundTruth.ts";

type ExpectedRelation = "same" | "different";
type Fingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;
type GroundTruthCase = (typeof OBSERVED_VOLATILITY_EVALUATION_CASES)[number];

async function snapshot(
  page: Page,
  baseUrl: string,
  suffix: string,
): Promise<SemanticStateSnapshot> {
  await page.goto(baseUrl + suffix);
  await page.reload();
  return observePage(page);
}

async function learnProfile(page: Page, baseUrl: string) {
  const titleTraining = [
    await snapshot(page, baseUrl, "#title-train-a"),
    await snapshot(page, baseUrl, "#title-train-b"),
  ];
  const queryTraining = [
    await snapshot(page, baseUrl, "?refreshToken=A17#query-dashboard"),
    await snapshot(page, baseUrl, "?refreshToken=B29#query-dashboard"),
  ];

  return createVolatilityProfile([
    learnScopedVolatilityRule(titleTraining, "title"),
    learnScopedVolatilityRule(queryTraining, "query:refreshToken"),
  ]);
}

export async function evaluateObservedVolatility(
  page: Page,
  baseUrl: string,
) {
  const profile = await learnProfile(page, baseUrl);
  const v4 = createFingerprintStateV4(profile);

  const pairs = [];
  for (const candidate of OBSERVED_VOLATILITY_EVALUATION_CASES) {
    pairs.push({
      candidate,
      left: await snapshot(page, baseUrl, candidate.left),
      right: await snapshot(page, baseUrl, candidate.right),
    });
  }

  const evaluate = (fingerprinter: Fingerprinter) => {
    const cases = pairs.map(({ candidate, left, right }) => {
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
    });

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
    profile,
    v1: evaluate(fingerprintState),
    v2: evaluate(fingerprintStateV2),
    v3: evaluate(fingerprintStateV3),
    v4: evaluate(v4),
  };
}
