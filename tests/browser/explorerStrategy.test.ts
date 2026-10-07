import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { compareExplorerStrategies } from "../../benchmarks/explorer-strategy/evaluate.ts";

const startUrl = pathToFileURL(resolve("benchmarks/explorer-strategy/index.html")).href;

test("v2 reduces noisy explorer states without losing meaningful coverage", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const result = await compareExplorerStrategies(page, startUrl);

  assert.equal(result.v1.meaningfulStateCoverage, 1);
  assert.equal(result.v2.meaningfulStateCoverage, 1);
  assert.equal(result.v2.graphStates, 2);
  assert.equal(result.v2.excessStates, 0);
  assert.equal(result.v2.failedTransitions, 0);
  assert.ok(result.v1.excessStates > result.v2.excessStates);
  assert.ok(result.v1.attemptedTransitions > result.v2.attemptedTransitions);

  assert.equal(result.v3.meaningfulStateCoverage, 1);
  assert.equal(result.v3.graphStates, 2);
  assert.equal(result.v3.excessStates, 0);
  assert.equal(result.v3.failedTransitions, 0);
  assert.equal(result.v3.attemptedTransitions, result.v2.attemptedTransitions);
});
