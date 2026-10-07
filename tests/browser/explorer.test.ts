import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { evaluateBasicStateGraph } from "../../benchmarks/basic-state-graph/evaluate.ts";
import { exploreWithPlaywright } from "../../src/browser/explorer.ts";

const benchmarkUrl = pathToFileURL(resolve("benchmarks/basic-state-graph/index.html")).href;

test("deterministic Playwright explorer covers the controlled benchmark", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await exploreWithPlaywright(page, { startUrl: benchmarkUrl });
  const coverage = evaluateBasicStateGraph(result.graph);

  assert.equal(result.graph.stateCount, 5);
  assert.equal(coverage.stateCoverage, 1);
  assert.equal(coverage.transitionCoverage, 1);
  assert.deepEqual(coverage.missingStates, []);
  assert.deepEqual(coverage.missingTransitions, []);
  assert.equal(result.attemptedTransitions, 9);
});
