import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { PHASE20_GROUND_TRUTH } from "../../benchmarks/scalability-recovery/groundTruth.ts";
import {
  parseExplorationCheckpoint,
  serializeExplorationCheckpoint,
} from "../../src/browser/explorationCheckpoint.ts";
import {
  exploreWithPlaywright,
  type ExplorationObservationPhase,
} from "../../src/browser/explorer.ts";
import { canonicalGraphSignature } from "../../src/research/scalabilityRecovery.ts";

const startUrl = pathToFileURL(
  resolve("benchmarks/scalability-recovery/deep-replay.html"),
).href;

test("Phase 20 browser deep replay reaches depth 32 with frozen replay cost", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  const counts: Record<ExplorationObservationPhase, number> = {
    initial: 0,
    "replay-step": 0,
    "restored-source": 0,
    "after-interaction": 0,
  };

  const result = await exploreWithPlaywright(page, {
    startUrl,
    maxTransitions:
      PHASE20_GROUND_TRUTH.browserDeepReplay.attempts,
    observationSink: ({ phase }) => {
      counts[phase] += 1;
    },
  });

  const expected = PHASE20_GROUND_TRUTH.browserDeepReplay;

  assert.equal(result.graph.stateCount, expected.states);
  assert.equal(
    result.graph.transitionCount,
    expected.transitions,
  );
  assert.equal(
    result.attemptedTransitions,
    expected.attempts,
  );
  assert.equal(
    counts["replay-step"],
    expected.replayStepObservations,
  );
  assert.equal(
    counts["restored-source"],
    expected.restoredSourceObservations,
  );
  assert.equal(
    counts["after-interaction"],
    expected.afterInteractionObservations,
  );
  assert.equal(
    result.graph
      .listTransitions()
      .filter((transition) => transition.status === "failed")
      .length,
    expected.failedTransitions,
  );

  assert.equal(
    result.graph
      .listStates()
      .some((state) =>
        state.snapshot.headings.includes(
          `Depth ${expected.depth}`,
        ),
      ),
    true,
  );
});

test("Phase 20 Playwright checkpoint resume matches uninterrupted deep replay", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const expected = PHASE20_GROUND_TRUTH.browserDeepReplay;

  const uninterruptedPage = await browser.newPage();
  const uninterrupted = await exploreWithPlaywright(
    uninterruptedPage,
    {
      startUrl,
      maxTransitions: expected.attempts,
    },
  );

  const partialPage = await browser.newPage();
  const partial = await exploreWithPlaywright(partialPage, {
    startUrl,
    maxTransitions: expected.checkpointInterruptAfterAttempts,
  });

  assert.equal(
    partial.attemptedTransitions,
    expected.checkpointInterruptAfterAttempts,
  );

  const persisted = parseExplorationCheckpoint(
    serializeExplorationCheckpoint(partial.checkpoint),
  );

  const resumedPage = await browser.newPage();
  const resumed = await exploreWithPlaywright(resumedPage, {
    startUrl,
    maxTransitions: expected.attempts,
    resumeFrom: persisted,
  });

  assert.equal(resumed.graph.stateCount, expected.states);
  assert.equal(
    resumed.graph.transitionCount,
    expected.transitions,
  );
  assert.equal(
    resumed.attemptedTransitions,
    expected.attempts,
  );
  assert.equal(
    canonicalGraphSignature(resumed.graph),
    canonicalGraphSignature(uninterrupted.graph),
  );
});
