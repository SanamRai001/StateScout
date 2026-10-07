import type { Page } from "playwright";

import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { BROWSER_GENERALIZATION_GROUND_TRUTH } from "./groundTruth.ts";

export interface BrowserAlgorithmMetrics {
  correct: number;
  total: number;
  falseMerges: number;
  falseSplits: number;
  cases: readonly { id: string; expected: "same" | "different"; predicted: "same" | "different"; correct: boolean }[];
}

async function snapshot(page: Page, baseUrl: string, suffix: string) {
  await page.goto(baseUrl + suffix);
  return observePage(page);
}

export async function evaluateBrowserGeneralization(page: Page, baseUrl: string) {
  const pairs = [];
  for (const candidate of BROWSER_GENERALIZATION_GROUND_TRUTH) {
    pairs.push({ candidate, left: await snapshot(page, baseUrl, candidate.left), right: await snapshot(page, baseUrl, candidate.right) });
  }

  const evaluate = (fingerprinter: typeof fingerprintState): BrowserAlgorithmMetrics => {
    const cases = pairs.map(({ candidate, left, right }) => {
      const predicted = fingerprinter(left).hash === fingerprinter(right).hash ? "same" : "different";
      return { id: candidate.id, expected: candidate.expected, predicted, correct: predicted === candidate.expected };
    });
    return {
      correct: cases.filter((item) => item.correct).length,
      total: cases.length,
      falseMerges: cases.filter((item) => item.expected === "different" && item.predicted === "same").length,
      falseSplits: cases.filter((item) => item.expected === "same" && item.predicted === "different").length,
      cases,
    };
  };

  return { v1: evaluate(fingerprintState), v2: evaluate(fingerprintStateV2) };
}
