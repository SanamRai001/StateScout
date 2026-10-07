import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import type { StateFingerprinter } from "../../src/core/graph.ts";
import type { SemanticStateSnapshot } from "../../src/core/model.ts";
import { createVolatilityProfile } from "../../src/core/volatility.ts";
import {
  PHASE17_CORPUS_CASES,
  type CorpusExpectedRelation,
  type Phase17CorpusCase,
} from "./groundTruth.ts";

export interface ObservedCorpusPair {
  candidate: Phase17CorpusCase;
  left: SemanticStateSnapshot;
  right: SemanticStateSnapshot;
}

export interface CorpusCaseResult {
  id: string;
  family: Phase17CorpusCase["family"];
  expected: CorpusExpectedRelation;
  predicted: CorpusExpectedRelation;
  correct: boolean;
  rationale: string;
}

export interface CorpusFamilyMetrics {
  family: Phase17CorpusCase["family"];
  total: number;
  correct: number;
  falseMerges: number;
  falseSplits: number;
}

export interface CorpusEvaluationMetrics {
  total: number;
  correct: number;
  accuracy: number;
  falseMerges: number;
  falseSplits: number;
  cases: readonly CorpusCaseResult[];
  families: readonly CorpusFamilyMetrics[];
}

function fixtureUrl(
  fixtureRootUrl: string,
  fixture: string,
  suffix: string,
): string {
  const root = fixtureRootUrl.endsWith("/")
    ? fixtureRootUrl
    : fixtureRootUrl + "/";
  return new URL(fixture + suffix, root).href;
}

async function snapshot(
  page: Page,
  fixtureRootUrl: string,
  fixture: string,
  suffix: string,
): Promise<SemanticStateSnapshot> {
  await page.goto(fixtureUrl(fixtureRootUrl, fixture, suffix));
  await page.reload();
  return observePage(page);
}

export async function observePhase17Corpus(
  page: Page,
  fixtureRootUrl: string,
): Promise<readonly ObservedCorpusPair[]> {
  const pairs: ObservedCorpusPair[] = [];

  for (const candidate of PHASE17_CORPUS_CASES) {
    pairs.push({
      candidate,
      left: await snapshot(
        page,
        fixtureRootUrl,
        candidate.leftFixture,
        candidate.leftSuffix,
      ),
      right: await snapshot(
        page,
        fixtureRootUrl,
        candidate.rightFixture,
        candidate.rightSuffix,
      ),
    });
  }

  return pairs;
}

export function evaluateObservedCorpus(
  pairs: readonly ObservedCorpusPair[],
  fingerprinter: StateFingerprinter,
): CorpusEvaluationMetrics {
  const cases: CorpusCaseResult[] = pairs.map(
    ({ candidate, left, right }) => {
      const predicted: CorpusExpectedRelation =
        fingerprinter(left).hash === fingerprinter(right).hash
          ? "same"
          : "different";

      return {
        id: candidate.id,
        family: candidate.family,
        expected: candidate.expected,
        predicted,
        correct: predicted === candidate.expected,
        rationale: candidate.rationale,
      };
    },
  );

  const familyNames = [
    ...new Set(cases.map((candidate) => candidate.family)),
  ].sort();

  const families: CorpusFamilyMetrics[] = familyNames.map(
    (family) => {
      const familyCases = cases.filter(
        (candidate) => candidate.family === family,
      );

      return {
        family,
        total: familyCases.length,
        correct: familyCases.filter(
          (candidate) => candidate.correct,
        ).length,
        falseMerges: familyCases.filter(
          (candidate) =>
            candidate.expected === "different" &&
            candidate.predicted === "same",
        ).length,
        falseSplits: familyCases.filter(
          (candidate) =>
            candidate.expected === "same" &&
            candidate.predicted === "different",
        ).length,
      };
    },
  );

  const correct = cases.filter((candidate) => candidate.correct).length;

  return {
    total: cases.length,
    correct,
    accuracy: cases.length === 0 ? 0 : correct / cases.length,
    falseMerges: cases.filter(
      (candidate) =>
        candidate.expected === "different" &&
        candidate.predicted === "same",
    ).length,
    falseSplits: cases.filter(
      (candidate) =>
        candidate.expected === "same" &&
        candidate.predicted === "different",
    ).length,
    cases,
    families,
  };
}

export async function evaluatePhase17Corpus(
  page: Page,
  fixtureRootUrl: string,
): Promise<CorpusEvaluationMetrics> {
  const pairs = await observePhase17Corpus(page, fixtureRootUrl);
  return evaluateObservedCorpus(
    pairs,
    createFingerprintStateV4(createVolatilityProfile([])),
  );
}
