import { createHash } from "node:crypto";
import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import { fingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import type { StateFingerprinter } from "../../src/core/graph.ts";
import type {
  SemanticStateSnapshot,
  StateFingerprint,
} from "../../src/core/model.ts";
import { createVolatilityProfile } from "../../src/core/volatility.ts";
import {
  evaluateObservedCorpus,
  type CorpusCaseResult,
  type CorpusEvaluationMetrics,
  type ObservedCorpusPair,
} from "./evaluate.ts";
import {
  PHASE17_CORPUS_CASES,
  type CorpusExpectedRelation,
} from "./groundTruth.ts";

const EMPTY_PROFILE = createVolatilityProfile([]);

export type Phase18StrategyName =
  | "url-only"
  | "v1"
  | "v2"
  | "v3"
  | "v4"
  | "v4-no-controls"
  | "v4-no-title"
  | "v4-no-query"
  | "v4-targeted-content";

export interface AugmentedObservedCorpusPair extends ObservedCorpusPair {
  leftTargetedContent: readonly string[];
  rightTargetedContent: readonly string[];
}

export interface Phase18Evaluation {
  pairs: readonly AugmentedObservedCorpusPair[];
  strategies: Readonly<Record<Phase18StrategyName, CorpusEvaluationMetrics>>;
}

function normalizeQuery(
  query: SemanticStateSnapshot["query"],
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(query).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    normalized[key] =
      typeof value === "string" ? value : [...value].sort();
  }

  return normalized;
}

function fingerprintCanonical(
  canonical: string,
  version: StateFingerprint["version"] = 4,
): StateFingerprint {
  return {
    algorithm: "statescout-semantic",
    version,
    canonical,
    hash: createHash("sha256").update(canonical).digest("hex"),
  };
}

const urlOnlyFingerprinter: StateFingerprinter = (snapshot) =>
  fingerprintCanonical(
    JSON.stringify({
      origin: snapshot.origin.toLowerCase(),
      path: snapshot.path || "/",
      query: normalizeQuery(snapshot.query),
    }),
    1,
  );

const v4NoControlsFingerprinter: StateFingerprinter = (snapshot) =>
  fingerprintStateV4(
    {
      ...snapshot,
      controls: [],
    },
    EMPTY_PROFILE,
  );

const v4NoTitleFingerprinter: StateFingerprinter = (snapshot) => {
  const {
    title: _ignoredTitle,
    ...withoutTitle
  } = snapshot;

  return fingerprintStateV4(withoutTitle, EMPTY_PROFILE);
};

const v4NoQueryFingerprinter: StateFingerprinter = (snapshot) =>
  fingerprintStateV4(
    {
      ...snapshot,
      query: {},
    },
    EMPTY_PROFILE,
  );

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

async function observeTargetedContent(
  page: Page,
): Promise<readonly string[]> {
  return page
    .locator("p,li,[role=status],[role=alert]")
    .evaluateAll((elements) => {
      const normalize = (value: string | null | undefined) =>
        value?.replace(/\s+/g, " ").trim() || undefined;

      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const style = getComputedStyle(html);
        const rect = html.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      return elements
        .filter(visible)
        .map((element) => normalize(element.textContent))
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b));
    });
}

async function observeAugmentedSide(
  page: Page,
  fixtureRootUrl: string,
  fixture: string,
  suffix: string,
): Promise<{
  snapshot: SemanticStateSnapshot;
  targetedContent: readonly string[];
}> {
  await page.goto(fixtureUrl(fixtureRootUrl, fixture, suffix));
  await page.reload();

  return {
    snapshot: await observePage(page),
    targetedContent: await observeTargetedContent(page),
  };
}

export async function observePhase18Corpus(
  page: Page,
  fixtureRootUrl: string,
): Promise<readonly AugmentedObservedCorpusPair[]> {
  const pairs: AugmentedObservedCorpusPair[] = [];

  for (const candidate of PHASE17_CORPUS_CASES) {
    const left = await observeAugmentedSide(
      page,
      fixtureRootUrl,
      candidate.leftFixture,
      candidate.leftSuffix,
    );
    const right = await observeAugmentedSide(
      page,
      fixtureRootUrl,
      candidate.rightFixture,
      candidate.rightSuffix,
    );

    pairs.push({
      candidate,
      left: left.snapshot,
      right: right.snapshot,
      leftTargetedContent: left.targetedContent,
      rightTargetedContent: right.targetedContent,
    });
  }

  return pairs;
}

function metricsFromCases(
  cases: readonly CorpusCaseResult[],
): CorpusEvaluationMetrics {
  const familyNames = [
    ...new Set(cases.map((candidate) => candidate.family)),
  ].sort();

  const families = familyNames.map((family) => {
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
  });

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

function targetedContentFingerprint(
  snapshot: SemanticStateSnapshot,
  content: readonly string[],
): StateFingerprint {
  const base = fingerprintStateV4(snapshot, EMPTY_PROFILE);
  return fingerprintCanonical(
    JSON.stringify({
      baseCanonical: base.canonical,
      targetedVisibleContent: [...content].sort(),
    }),
    4,
  );
}

function evaluateTargetedContent(
  pairs: readonly AugmentedObservedCorpusPair[],
): CorpusEvaluationMetrics {
  const cases: CorpusCaseResult[] = pairs.map((pair) => {
    const predicted: CorpusExpectedRelation =
      targetedContentFingerprint(
        pair.left,
        pair.leftTargetedContent,
      ).hash ===
      targetedContentFingerprint(
        pair.right,
        pair.rightTargetedContent,
      ).hash
        ? "same"
        : "different";

    return {
      id: pair.candidate.id,
      family: pair.candidate.family,
      expected: pair.candidate.expected,
      predicted,
      correct: predicted === pair.candidate.expected,
      rationale: pair.candidate.rationale,
    };
  });

  return metricsFromCases(cases);
}

export function evaluatePhase18Strategies(
  pairs: readonly AugmentedObservedCorpusPair[],
): Readonly<Record<Phase18StrategyName, CorpusEvaluationMetrics>> {
  const basePairs: ObservedCorpusPair[] = pairs.map(
    ({ candidate, left, right }) => ({
      candidate,
      left,
      right,
    }),
  );

  return {
    "url-only": evaluateObservedCorpus(
      basePairs,
      urlOnlyFingerprinter,
    ),
    v1: evaluateObservedCorpus(basePairs, fingerprintState),
    v2: evaluateObservedCorpus(basePairs, fingerprintStateV2),
    v3: evaluateObservedCorpus(basePairs, fingerprintStateV3),
    v4: evaluateObservedCorpus(
      basePairs,
      (snapshot) => fingerprintStateV4(snapshot, EMPTY_PROFILE),
    ),
    "v4-no-controls": evaluateObservedCorpus(
      basePairs,
      v4NoControlsFingerprinter,
    ),
    "v4-no-title": evaluateObservedCorpus(
      basePairs,
      v4NoTitleFingerprinter,
    ),
    "v4-no-query": evaluateObservedCorpus(
      basePairs,
      v4NoQueryFingerprinter,
    ),
    "v4-targeted-content": evaluateTargetedContent(pairs),
  };
}

export async function evaluatePhase18(
  page: Page,
  fixtureRootUrl: string,
): Promise<Phase18Evaluation> {
  const pairs = await observePhase18Corpus(page, fixtureRootUrl);
  return {
    pairs,
    strategies: evaluatePhase18Strategies(pairs),
  };
}
