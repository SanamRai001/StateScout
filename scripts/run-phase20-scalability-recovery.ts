import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { PHASE20_GROUND_TRUTH } from "../benchmarks/scalability-recovery/groundTruth.ts";
import {
  parseExplorationCheckpoint,
  serializeExplorationCheckpoint,
} from "../src/browser/explorationCheckpoint.ts";
import {
  exploreWithPlaywright,
  type ExplorationObservationPhase,
} from "../src/browser/explorer.ts";
import {
  canonicalGraphSignature,
  measureSyntheticScale,
  verifySyntheticCheckpointRecovery,
} from "../src/research/scalabilityRecovery.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-20-scalability-recovery.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const deepReplayUrl = pathToFileURL(
  resolve("benchmarks/scalability-recovery/deep-replay.html"),
).href;

const scaleMeasurements =
  PHASE20_GROUND_TRUTH.syntheticScale.map((expected) =>
    measureSyntheticScale(expected.states),
  );

const syntheticRecovery =
  verifySyntheticCheckpointRecovery(
    PHASE20_GROUND_TRUTH.checkpointRecovery.states,
    PHASE20_GROUND_TRUTH.checkpointRecovery
      .interruptAfterAttempts,
  );

const browser = await chromium.launch({ headless: true });

try {
  const phaseCounts: Record<
    ExplorationObservationPhase,
    number
  > = {
    initial: 0,
    "replay-step": 0,
    "restored-source": 0,
    "after-interaction": 0,
  };

  const uninterruptedPage = await browser.newPage();
  const browserHeapBefore = process.memoryUsage().heapUsed;
  const browserStarted = performance.now();
  const uninterrupted = await exploreWithPlaywright(
    uninterruptedPage,
    {
      startUrl: deepReplayUrl,
      maxTransitions:
        PHASE20_GROUND_TRUTH.browserDeepReplay.attempts,
      observationSink: ({ phase }) => {
        phaseCounts[phase] += 1;
      },
    },
  );
  const browserDurationMs = performance.now() - browserStarted;
  const browserHeapAfter = process.memoryUsage().heapUsed;

  const partialPage = await browser.newPage();
  const partial = await exploreWithPlaywright(partialPage, {
    startUrl: deepReplayUrl,
    maxTransitions:
      PHASE20_GROUND_TRUTH.browserDeepReplay
        .checkpointInterruptAfterAttempts,
  });

  const serializedBrowserCheckpoint =
    serializeExplorationCheckpoint(partial.checkpoint);
  const parsedBrowserCheckpoint =
    parseExplorationCheckpoint(
      serializedBrowserCheckpoint,
    );

  const resumedPage = await browser.newPage();
  const resumed = await exploreWithPlaywright(resumedPage, {
    startUrl: deepReplayUrl,
    maxTransitions:
      PHASE20_GROUND_TRUTH.browserDeepReplay.attempts,
    resumeFrom: parsedBrowserCheckpoint,
  });

  const browserResult = {
    states: uninterrupted.graph.stateCount,
    transitions: uninterrupted.graph.transitionCount,
    attempts: uninterrupted.attemptedTransitions,
    failedTransitions: uninterrupted.graph
      .listTransitions()
      .filter((transition) => transition.status === "failed")
      .length,
    observationCounts: phaseCounts,
    durationMs: browserDurationMs,
    heapDeltaBytes: browserHeapAfter - browserHeapBefore,
    checkpointInterruptAfterAttempts:
      partial.attemptedTransitions,
    checkpointBytes: Buffer.byteLength(
      serializedBrowserCheckpoint,
      "utf8",
    ),
    resumedStates: resumed.graph.stateCount,
    resumedTransitions: resumed.graph.transitionCount,
    resumedAttempts: resumed.attemptedTransitions,
    resumedMatchesUninterrupted:
      canonicalGraphSignature(resumed.graph) ===
      canonicalGraphSignature(uninterrupted.graph),
  };

  const report = {
    schemaVersion: 1,
    experiment: "phase-20-scalability-recovery",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    groundTruth: PHASE20_GROUND_TRUTH,
    syntheticScale: scaleMeasurements,
    syntheticCheckpointRecovery: {
      interruptAfterAttempts:
        syntheticRecovery.partial.attemptedTransitions,
      finalAttempts:
        syntheticRecovery.resumed.attemptedTransitions,
      finalStates:
        syntheticRecovery.resumed.graph.stateCount,
      finalTransitions:
        syntheticRecovery.resumed.graph.transitionCount,
      finalFailedTransitions:
        syntheticRecovery.resumed.failedTransitions,
      checkpointBytes:
        syntheticRecovery.serializedCheckpointBytes,
      resumedMatchesUninterrupted:
        syntheticRecovery.resumedMatchesUninterrupted,
      corruptedCheckpointRejected:
        syntheticRecovery.corruptedCheckpointRejected,
    },
    browserDeepReplay: browserResult,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const scaleLines = scaleMeasurements.map(
    (measurement) =>
      `Synthetic ${measurement.states}: transitions=${measurement.transitions}, attempts=${measurement.attempts}, failed=${measurement.failedTransitions}, durationMs=${measurement.durationMs.toFixed(3)}, heapDeltaBytes=${measurement.heapDeltaBytes}`,
  );

  const summary = [
    "Phase 20 scalability-and-recovery summary",
    ...scaleLines,
    `Synthetic checkpoint interrupt/final attempts: ${syntheticRecovery.partial.attemptedTransitions}/${syntheticRecovery.resumed.attemptedTransitions}`,
    `Synthetic resumed states/transitions/failed: ${syntheticRecovery.resumed.graph.stateCount}/${syntheticRecovery.resumed.graph.transitionCount}/${syntheticRecovery.resumed.failedTransitions}`,
    `Synthetic checkpoint bytes: ${syntheticRecovery.serializedCheckpointBytes}`,
    `Synthetic resumed matches uninterrupted: ${syntheticRecovery.resumedMatchesUninterrupted}`,
    `Corrupted checkpoint rejected: ${syntheticRecovery.corruptedCheckpointRejected}`,
    `Browser deep replay states/transitions/attempts: ${browserResult.states}/${browserResult.transitions}/${browserResult.attempts}`,
    `Browser replay-step/restored/after observations: ${phaseCounts["replay-step"]}/${phaseCounts["restored-source"]}/${phaseCounts["after-interaction"]}`,
    `Browser durationMs/heapDeltaBytes: ${browserResult.durationMs.toFixed(3)}/${browserResult.heapDeltaBytes}`,
    `Browser checkpoint interrupt/final attempts: ${browserResult.checkpointInterruptAfterAttempts}/${browserResult.resumedAttempts}`,
    `Browser checkpoint bytes: ${browserResult.checkpointBytes}`,
    `Browser resumed matches uninterrupted: ${browserResult.resumedMatchesUninterrupted}`,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
