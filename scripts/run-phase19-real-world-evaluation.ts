import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  chromium,
  type Browser,
  type Page,
} from "playwright";

import {
  PHASE19_PROTOCOL,
  PHASE19_REAL_WORLD_TARGETS,
  type RealWorldTarget,
} from "../benchmarks/real-world-v1/targets.ts";
import { exploreWithPlaywright } from "../src/browser/explorer.ts";
import { createFingerprintStateV4 } from "../src/core/fingerprintV4.ts";
import type { TransitionStatus } from "../src/core/model.ts";
import { createVolatilityProfile } from "../src/core/volatility.ts";
import {
  summarizeRealWorldRuns,
  summarizeRealWorldStudy,
  type RealWorldRun,
  type RealWorldTransitionStatusCounts,
} from "../src/research/realWorldEvaluation.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-19-real-world-evaluation.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const EMPTY_PROFILE = createVolatilityProfile([]);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function graphSignature(
  states: readonly { id: string; fingerprint: { hash: string } }[],
  transitions: readonly {
    fromStateId: string;
    toStateId?: string;
    interaction: { id: string };
    status: TransitionStatus;
  }[],
): string {
  const canonical = JSON.stringify({
    states: states.map((state) => state.fingerprint.hash).sort(),
    transitions: transitions
      .map((transition) => [
        transition.fromStateId,
        transition.toStateId ?? null,
        transition.interaction.id,
        transition.status,
      ])
      .sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      ),
  });

  return createHash("sha256").update(canonical).digest("hex");
}

function transitionStatusCounts(
  transitions: readonly { status: TransitionStatus }[],
): RealWorldTransitionStatusCounts {
  const counts: RealWorldTransitionStatusCounts = {
    observed: 0,
    blockedByPolicy: 0,
    failed: 0,
    noStateChange: 0,
  };

  for (const transition of transitions) {
    switch (transition.status) {
      case "observed":
        counts.observed += 1;
        break;
      case "blocked-by-policy":
        counts.blockedByPolicy += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      case "no-state-change":
        counts.noStateChange += 1;
        break;
    }
  }

  return counts;
}

async function preflight(
  page: Page,
  target: RealWorldTarget,
): Promise<void> {
  await page.goto(target.url, {
    waitUntil: "domcontentloaded",
    timeout: PHASE19_PROTOCOL.navigationTimeoutMs,
  });
}

async function runTargetOnce(
  browser: Browser,
  target: RealWorldTarget,
  runIndex: number,
): Promise<RealWorldRun> {
  const startedAt = Date.now();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(
      PHASE19_PROTOCOL.navigationTimeoutMs,
    );
    page.setDefaultTimeout(PHASE19_PROTOCOL.actionTimeoutMs);

    try {
      await preflight(page, target);
    } catch (error) {
      return {
        targetId: target.id,
        runIndex,
        status: "unavailable",
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
      };
    }

    try {
      const result = await exploreWithPlaywright(page, {
        startUrl: target.url,
        maxTransitions: target.maxTransitions,
        fingerprinter: createFingerprintStateV4(EMPTY_PROFILE),
      });

      const states = result.graph.listStates();
      const transitions = result.graph.listTransitions();
      const initial = result.graph.getState(result.rootPath.stateId);

      if (!initial) {
        throw new Error("Missing initial graph state after exploration.");
      }

      return {
        targetId: target.id,
        runIndex,
        status: "success",
        durationMs: Date.now() - startedAt,
        initialFingerprintHash: initial.fingerprint.hash,
        graphSignature: graphSignature(states, transitions),
        stateCount: result.graph.stateCount,
        transitionCount: result.graph.transitionCount,
        attemptedTransitions: result.attemptedTransitions,
        evidenceErrorCount: result.evidenceErrors.length,
        transitionStatuses: transitionStatusCounts(transitions),
      };
    } catch (error) {
      return {
        targetId: target.id,
        runIndex,
        status: "run-error",
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
      };
    }
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });

try {
  const targetReports = [];

  for (const target of PHASE19_REAL_WORLD_TARGETS) {
    const runs: RealWorldRun[] = [];

    for (let runIndex = 1; runIndex <= target.runs; runIndex += 1) {
      const run = await runTargetOnce(browser, target, runIndex);
      runs.push(run);
      console.log(
        `[${target.id}] run ${runIndex}/${target.runs}: ${run.status}`,
      );
    }

    const summary = summarizeRealWorldRuns(
      target.id,
      target.runs,
      runs,
      PHASE19_PROTOCOL.minimumSuccessfulRunsForStability,
    );

    targetReports.push({
      target,
      runs,
      summary,
    });
  }

  const study = summarizeRealWorldStudy(
    targetReports.map((report) => report.summary),
  );
  const studyEvaluable =
    study.evaluableTargets >= PHASE19_PROTOCOL.minimumEvaluableTargets;

  const report = {
    schemaVersion: 1,
    experiment: "phase-19-real-world-evaluation",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    protocol: PHASE19_PROTOCOL,
    targetReports,
    study,
    studyEvaluable,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const targetLines = targetReports.map(({ target, summary }) => {
    const states = summary.stateCountRange
      ? `${summary.stateCountRange.min}-${summary.stateCountRange.max}`
      : "n/a";
    const transitions = summary.transitionCountRange
      ? `${summary.transitionCountRange.min}-${summary.transitionCountRange.max}`
      : "n/a";
    const attempts = summary.attemptedTransitionRange
      ? `${summary.attemptedTransitionRange.min}-${summary.attemptedTransitionRange.max}`
      : "n/a";

    return [
      `${target.id}: success=${summary.successfulRuns}/${summary.requestedRuns}`,
      `unavailable=${summary.unavailableRuns}`,
      `run-errors=${summary.runErrorRuns}`,
      `evaluable=${summary.evaluable}`,
      `initial-stable=${summary.stableInitialFingerprint}`,
      `graph-stable=${summary.stableGraphStructure}`,
      `states=${states}`,
      `transitions=${transitions}`,
      `attempts=${attempts}`,
      `status(O/B/F/N)=${summary.transitionStatuses.observed}/${summary.transitionStatuses.blockedByPolicy}/${summary.transitionStatuses.failed}/${summary.transitionStatuses.noStateChange}`,
    ].join(", ");
  });

  const summary = [
    "Phase 19 real-world-evaluation summary",
    `Targets/requested runs: ${study.targets}/${study.requestedRuns}`,
    `Successful/unavailable/run-error runs: ${study.successfulRuns}/${study.unavailableRuns}/${study.runErrorRuns}`,
    `Evaluable targets: ${study.evaluableTargets}/${study.targets} (minimum ${PHASE19_PROTOCOL.minimumEvaluableTargets})`,
    `Stable initial targets: ${study.stableInitialTargets}`,
    `Stable graph targets: ${study.stableGraphTargets}`,
    `Study evaluable: ${studyEvaluable}`,
    ...targetLines,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");
  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);

  if (!studyEvaluable) {
    process.exitCode = 2;
  }
} finally {
  await browser.close();
}
