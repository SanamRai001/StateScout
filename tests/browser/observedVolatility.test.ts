import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateObservedVolatility } from "../../benchmarks/observed-volatility/evaluate.ts";

const baseUrl = pathToFileURL(
  resolve("benchmarks/observed-volatility/index.html"),
).href;

test("v4 applies trusted observed volatility only within matching semantic anchors", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateObservedVolatility(page, baseUrl);

  assert.equal(result.profile.rules.length, 2);

  assert.equal(result.v1.correct, 3);
  assert.equal(result.v1.falseMerges, 0);
  assert.equal(result.v1.falseSplits, 3);

  assert.equal(result.v2.correct, 2);
  assert.equal(result.v2.falseMerges, 2);
  assert.equal(result.v2.falseSplits, 2);

  assert.equal(result.v3.correct, 3);
  assert.equal(result.v3.falseMerges, 1);
  assert.equal(result.v3.falseSplits, 2);

  assert.equal(result.v4.correct, 6);
  assert.equal(result.v4.falseMerges, 0);
  assert.equal(result.v4.falseSplits, 0);
});
