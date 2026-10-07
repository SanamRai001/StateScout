import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateAdversarialIdentity } from "../../benchmarks/adversarial-identity/evaluate.ts";

const baseUrl = pathToFileURL(resolve("benchmarks/adversarial-identity/index.html")).href;

test("Phase 6 freezes known v2 false-merge risks instead of hiding them", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluateAdversarialIdentity(page, baseUrl);

  assert.equal(result.v1.total, 6);
  assert.equal(result.v1.correct, 5);
  assert.equal(result.v1.falseMerges, 0);
  assert.equal(result.v1.falseSplits, 1);

  assert.equal(result.v2.correct, 4);
  assert.equal(result.v2.falseMerges, 2);
  assert.equal(result.v2.falseSplits, 0);

  const v2Failures = result.v2.cases
    .filter((candidate) => !candidate.correct)
    .map((candidate) => candidate.id)
    .sort();

  assert.deepEqual(v2Failures, ["meaningful-title-time", "semantic-ref-query"]);
});
