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
import {
  PHASE19_RECOVERY_PROTOCOL,
  PHASE19_RECOVERY_TARGETS,
} from "../benchmarks/real-world-v1/recoveryTargets.ts";
import { exploreWithPlaywright } from "../src/browser/explorer.ts";
import { createFingerprintStateV4 } from "../src/core/fingerprintV4.ts";
import type { TransitionStatus } from "../src/core/model.ts";
import { createVolatilityProfile } from "../src/core/volatility.ts";
import {
  isRealWorldStudyEvaluable,
  summarizeRealWorldRuns,
  summarizeRealWorldStudy,
  type RealWorldRun,
  type RealWorldTargetSummary,
  type RealWorldTransitionStatusCounts,
} from "../src/research/realWorldEvaluation.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-19-real-world-evaluation.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");
const EMPTY_PROFILE = createVolatilityProfile([]);

type CohortId = "primary" | "recovery";

interface TargetReport {
  cohort: CohortId;
  target: RealWorldTarget;
  runs: RealWorldRun[];
  summary: RealWorldTargetSummary;
}

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

async function runCohort(
  browser: Browser,
  cohort: CohortId,
  targets: readonly RealWorldTarget[],
): Promise<TargetReport[]> {
  const reports: TargetReport[] = [];

  for (const target of targets) {
    const runs: RealWorldRun[] = [];

    for (let runIndex = 1; runIndex <= target.runs; runIndex += 1) {
      const run = await runTargetOnce(browser, target, runIndex);
      runs.push(run);
      console.log(
        `[${cohort}:${target.id}] run ${runIndex}/${target.runs}: ${run.status}`,
      );
    }

    reports.push({
      cohort,
      target,
      runs,
      summary: summarizeRealWorldRuns(
        target.id,
        target.runs,
        runs,
        PHASE19_PROTOCOL.minimumSuccessfulRunsForStability,
      ),
    });
  }

  return reports;
}

function targetLine(report: TargetReport): string {
  const { cohort, target, summary } = report;
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
    `${cohort}:${target.id}: success=${summary.successfulRuns}/${summary.requestedRuns}`,
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
}

const browser = await chromium.launch({ headless: true });

try {
  const primaryReports = await runCohort(
    browser,
    "primary",
    PHASE19_REAL_WORLD_TARGETS,
  );
  const recoveryReports = await runCohort(
    browser,
    "recovery",
    PHASE19_RECOVERY_TARGETS,
  );
  const targetReports = [...primaryReports, ...recoveryReports];

  const primaryStudy = summarizeRealWorldStudy(
    primaryReports.map((report) => report.summary),
  );
  const recoveryStudy = summarizeRealWorldStudy(
    recoveryReports.map((report) => report.summary),
  );
  const combinedStudy = summarizeRealWorldStudy(
    targetReports.map((report) => report.summary),
  );
  const studyEvaluable = isRealWorldStudyEvaluable(
    targetReports.map((report) => report.summary),
    PHASE19_RECOVERY_PROTOCOL.minimumCombinedEvaluableTargets,
  );

  const report = {
    schemaVersion: 2,
    experiment: "phase-19-real-world-evaluation",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    protocol: PHASE19_PROTOCOL,
    recoveryProtocol: PHASE19_RECOVERY_PROTOCOL,
    targetReports,
    primaryStudy,
    recoveryStudy,
    study: combinedStudy,
    studyEvaluable,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const summary = [
    "Phase 19 real-world-evaluation summary",
    `Primary targets/requested runs: ${primaryStudy.targets}/${primaryStudy.requestedRuns}`,
    `Recovery targets/requested runs: ${recoveryStudy.targets}/${recoveryStudy.requestedRuns}`,
    `Combined targets/requested runs: ${combinedStudy.targets}/${combinedStudy.requestedRuns}`,
    `Combined successful/unavailable/run-error runs: ${combinedStudy.successfulRuns}/${combinedStudy.unavailableRuns}/${combinedStudy.runErrorRuns}`,
    `Primary evaluable targets: ${primaryStudy.evaluableTargets}/${primaryStudy.targets}`,
    `Recovery evaluable targets: ${recoveryStudy.evaluableTargets}/${recoveryStudy.targets}`,
    `Combined evaluable targets: ${combinedStudy.evaluableTargets}/${combinedStudy.targets} (minimum ${PHASE19_RECOVERY_PROTOCOL.minimumCombinedEvaluableTargets})`,
    `Stable initial targets: ${combinedStudy.stableInitialTargets}`,
    `Stable graph targets: ${combinedStudy.stableGraphTargets}`,
    `Study evaluable: ${studyEvaluable}`,
    ...targetReports.map(targetLine),
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
