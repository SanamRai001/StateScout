import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateBroaderGeneralization } from "../../benchmarks/broader-generalization/evaluate.ts";

const baseUrl = pathToFileURL(
  resolve("benchmarks/broader-generalization/index.html"),
).href;

test("Phase 8 broader fixture exposes the remaining v3 second-resolution false merge", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateBroaderGeneralization(page, baseUrl);

  assert.equal(result.v1.total, 10);
  assert.equal(result.v1.correct, 8);
  assert.equal(result.v1.falseMerges, 0);
  assert.equal(result.v1.falseSplits, 2);

  assert.equal(result.v2.correct, 7);
  assert.equal(result.v2.falseMerges, 3);
  assert.equal(result.v2.falseSplits, 0);

  assert.equal(result.v3.correct, 9);
  assert.equal(result.v3.falseMerges, 1);
  assert.equal(result.v3.falseSplits, 0);

  const v3Failures = result.v3.cases
    .filter((candidate) => !candidate.correct)
    .map((candidate) => candidate.id);

  assert.deepEqual(v3Failures, ["meaningful-second-title"]);
});
