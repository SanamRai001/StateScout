import assert from "node:assert/strict";
import { resolve, sep } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluatePhase18 } from "../../benchmarks/corpus-v1/phase18Evaluate.ts";
import {
  PHASE18_EXPECTED_FAILURES,
  PHASE18_EXPECTED_METRICS,
  PHASE18_FROZEN_INTERPRETATION,
} from "../../benchmarks/corpus-v1/phase18GroundTruth.ts";

const fixtureRootUrl = pathToFileURL(
  resolve("benchmarks/corpus-v1") + sep,
).href;

test("Phase 18 reproduces frozen baseline and ablation metrics on one observed corpus", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluatePhase18(page, fixtureRootUrl);

  assert.equal(
    result.pairs.length,
    PHASE18_FROZEN_INTERPRETATION.totalCases,
  );

  for (const [strategy, expected] of Object.entries(
    PHASE18_EXPECTED_METRICS,
  )) {
    const metrics =
      result.strategies[
        strategy as keyof typeof result.strategies
      ];

    assert.deepEqual(
      {
        correct: metrics.correct,
        accuracy: metrics.accuracy,
        falseMerges: metrics.falseMerges,
        falseSplits: metrics.falseSplits,
      },
      expected,
      strategy,
    );

    assert.deepEqual(
      metrics.cases
        .filter((candidate) => !candidate.correct)
        .map((candidate) => candidate.id),
      PHASE18_EXPECTED_FAILURES[
        strategy as keyof typeof PHASE18_EXPECTED_FAILURES
      ],
      `${strategy} failure set`,
    );
  }
});

test("Phase 18 ablations identify controls, title, query, and content contributions", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const { strategies } = await evaluatePhase18(
    page,
    fixtureRootUrl,
  );

  assert.equal(strategies.v4.correct, 14);
  assert.equal(strategies["v4-no-controls"].correct, 9);
  assert.equal(strategies["v4-no-title"].correct, 13);
  assert.equal(strategies["v4-no-query"].correct, 13);
  assert.equal(
    strategies["v4-targeted-content"].correct,
    16,
  );

  assert.equal(
    strategies["v4-targeted-content"].falseMerges,
    0,
  );
  assert.equal(
    strategies["v4-targeted-content"].falseSplits,
    0,
  );

  assert.ok(
    strategies["url-only"].falseMerges >
      strategies.v4.falseMerges,
  );
  assert.ok(
    strategies["v4-no-controls"].falseMerges >
      strategies.v4.falseMerges,
  );
});

test("Phase 18 targeted-content augmentation changes only the two frozen content failures", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const { strategies } = await evaluatePhase18(
    page,
    fixtureRootUrl,
  );

  const changedPredictions = strategies.v4.cases
    .filter((baselineCase, index) => {
      const augmented =
        strategies["v4-targeted-content"].cases[index];
      return augmented?.predicted !== baselineCase.predicted;
    })
    .map((candidate) => candidate.id);

  assert.deepEqual(changedPredictions, [
    "plain-status-text-state",
    "list-content-state",
  ]);
});
