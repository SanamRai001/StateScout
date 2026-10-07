import assert from "node:assert/strict";
import { resolve, sep } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluatePhase17Corpus } from "../../benchmarks/corpus-v1/evaluate.ts";
import {
  PHASE17_CORPUS_CASES,
  PHASE17_CORPUS_FROZEN_COUNTS,
} from "../../benchmarks/corpus-v1/groundTruth.ts";

const fixtureRootUrl = pathToFileURL(
  resolve("benchmarks/corpus-v1") + sep,
).href;

test("Phase 17 broader corpus exposes current observer content-coverage limits", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const result = await evaluatePhase17Corpus(page, fixtureRootUrl);

  assert.equal(
    PHASE17_CORPUS_CASES.length,
    PHASE17_CORPUS_FROZEN_COUNTS.total,
  );
  assert.equal(
    PHASE17_CORPUS_CASES.filter(
      (candidate) => candidate.expected === "same",
    ).length,
    PHASE17_CORPUS_FROZEN_COUNTS.same,
  );
  assert.equal(
    PHASE17_CORPUS_CASES.filter(
      (candidate) => candidate.expected === "different",
    ).length,
    PHASE17_CORPUS_FROZEN_COUNTS.different,
  );
  assert.equal(
    new Set(
      PHASE17_CORPUS_CASES.map((candidate) => candidate.family),
    ).size,
    PHASE17_CORPUS_FROZEN_COUNTS.families,
  );

  assert.equal(result.total, 16);
  assert.equal(result.correct, 14);
  assert.equal(result.accuracy, 0.875);
  assert.equal(result.falseMerges, 2);
  assert.equal(result.falseSplits, 0);

  const failures = result.cases
    .filter((candidate) => !candidate.correct)
    .map((candidate) => candidate.id);

  assert.deepEqual(failures, [
    "plain-status-text-state",
    "list-content-state",
  ]);

  const contentFamily = result.families.find(
    (family) => family.family === "content-coverage",
  );
  assert.deepEqual(contentFamily, {
    family: "content-coverage",
    total: 2,
    correct: 0,
    falseMerges: 2,
    falseSplits: 0,
  });

  assert.ok(
    result.families
      .filter((family) => family.family !== "content-coverage")
      .every((family) => family.correct === family.total),
  );
});
