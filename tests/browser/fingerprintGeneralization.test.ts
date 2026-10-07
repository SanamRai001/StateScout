import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import { evaluateBrowserGeneralization } from "../../benchmarks/browser-generalization/evaluate.ts";

const baseUrl = pathToFileURL(resolve("benchmarks/browser-generalization/index.html")).href;

test("fingerprint v2 generalizes across real browser observations without false merges", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const result = await evaluateBrowserGeneralization(page, baseUrl);

  assert.equal(result.v1.total, 4);
  assert.equal(result.v1.falseSplits, 1);
  assert.equal(result.v1.falseMerges, 0);
  assert.equal(result.v2.correct, 4);
  assert.equal(result.v2.falseSplits, 0);
  assert.equal(result.v2.falseMerges, 0);

  assert.equal(result.v3.correct, 4);
  assert.equal(result.v3.falseSplits, 0);
  assert.equal(result.v3.falseMerges, 0);
});
