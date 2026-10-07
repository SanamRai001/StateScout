import type { Page } from "playwright";

import { BfsFrontier } from "../core/frontier.ts";
import { StateGraph, type StateFingerprinter } from "../core/graph.ts";
import { fingerprintState } from "../core/fingerprint.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
  StatePath,
} from "../core/model.ts";
import {
  DEFAULT_ACTION_POLICY,
  canExecuteInteraction,
  type ActionExecutionPolicy,
} from "../core/policy.ts";
import {
  discoverInteractions,
  executeInteraction,
  observePage,
} from "./playwrightAdapter.ts";

export type ExplorationObservationPhase =
  | "initial"
  | "replay-step"
  | "restored-source"
  | "after-interaction";

export interface ExplorationObservation {
  phase: ExplorationObservationPhase;
  snapshot: SemanticStateSnapshot;
}

export type ExplorationObservationSink = (
  observation: ExplorationObservation,
) => void;

export interface ExplorationOptions {
  startUrl: string;
  actionPolicy?: ActionExecutionPolicy;
  maxTransitions?: number;
  fingerprinter?: StateFingerprinter;
  observationSink?: ExplorationObservationSink;
}

export interface ExplorationResult {
  graph: StateGraph;
  rootPath: StatePath;
  attemptedTransitions: number;
  evidenceErrors: readonly string[];
}

async function restoreState(
  page: Page,
  startUrl: string,
  path: StatePath,
  fingerprinter: StateFingerprinter,
  observeForRun: (
    phase: ExplorationObservationPhase,
  ) => Promise<SemanticStateSnapshot>,
): Promise<void> {
  await page.goto(startUrl);

  for (const step of path.steps) {
    await executeInteraction(page, step.interaction);
    const snapshot = await observeForRun("replay-step");
    const actual = fingerprinter(snapshot).hash;

    if (actual !== step.expectedStateHash) {
      throw new Error(
        `Replay diverged after interaction ${step.interaction.id}: expected ${step.expectedStateHash}, observed ${actual}`,
      );
    }
  }
}

function enqueueInteractions(
  frontier: BfsFrontier,
  stateId: string,
  path: StatePath,
  interactions: readonly Interaction[],
  policy: ActionExecutionPolicy,
  graph: StateGraph,
): void {
  for (const interaction of interactions) {
    if (!canExecuteInteraction(interaction, policy)) {
      graph.addTransition({
        fromStateId: stateId,
        interaction,
        status: "blocked-by-policy",
      });
      continue;
    }

    frontier.enqueue({
      fromStateId: stateId,
      interaction,
      replayPath: path,
    });
  }
}

export async function exploreWithPlaywright(
  page: Page,
  options: ExplorationOptions,
): Promise<ExplorationResult> {
  // Identity is frozen for the entire run. Evidence collection is observation-only
  // and has no API to replace or mutate this run's fingerprinter.
  const runFingerprinter = options.fingerprinter ?? fingerprintState;
  const graph = new StateGraph(runFingerprinter);
  const frontier = new BfsFrontier();
  const policy = options.actionPolicy ?? DEFAULT_ACTION_POLICY;
  const maxTransitions = options.maxTransitions ?? 1_000;
  const evidenceErrors: string[] = [];

  const observeForRun = async (
    phase: ExplorationObservationPhase,
  ): Promise<SemanticStateSnapshot> => {
    const snapshot = await observePage(page);

    if (options.observationSink) {
      try {
        options.observationSink({ phase, snapshot });
      } catch (error) {
        evidenceErrors.push(
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return snapshot;
  };

  await page.goto(options.startUrl);
  const initialSnapshot = await observeForRun("initial");
  const initial = graph.upsertState(initialSnapshot);
  const rootPath: StatePath = { stateId: initial.node.id, steps: [] };

  enqueueInteractions(
    frontier,
    initial.node.id,
    rootPath,
    await discoverInteractions(page),
    policy,
    graph,
  );

  let attemptedTransitions = 0;

  while (frontier.size > 0 && attemptedTransitions < maxTransitions) {
    const work = frontier.dequeue();
    if (!work) break;

    attemptedTransitions += 1;

    try {
      await restoreState(
        page,
        options.startUrl,
        work.replayPath,
        runFingerprinter,
        observeForRun,
      );
      const restored = graph.upsertState(
        await observeForRun("restored-source"),
      );

      if (restored.node.id !== work.fromStateId) {
        throw new Error(
          `Replay restored ${restored.node.id}, expected ${work.fromStateId}`,
        );
      }

      await executeInteraction(page, work.interaction);
      const nextSnapshot = await observeForRun("after-interaction");
      const next = graph.upsertState(nextSnapshot);

      graph.addTransition({
        fromStateId: work.fromStateId,
        toStateId: next.node.id,
        interaction: work.interaction,
        status:
          next.node.id === work.fromStateId ? "no-state-change" : "observed",
      });

      if (next.isNew) {
        const nextPath: StatePath = {
          stateId: next.node.id,
          steps: [
            ...work.replayPath.steps,
            {
              interaction: work.interaction,
              expectedStateHash: next.node.fingerprint.hash,
            },
          ],
        };

        enqueueInteractions(
          frontier,
          next.node.id,
          nextPath,
          await discoverInteractions(page),
          policy,
          graph,
        );
      }
    } catch (error) {
      graph.addTransition({
        fromStateId: work.fromStateId,
        interaction: work.interaction,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { graph, rootPath, attemptedTransitions, evidenceErrors };
}
