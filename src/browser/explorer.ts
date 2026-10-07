import type { Page } from "playwright";

import { BfsFrontier } from "../core/frontier.ts";
import { StateGraph, type StateFingerprinter } from "../core/graph.ts";
import { fingerprintState } from "../core/fingerprint.ts";
import type { Interaction, StatePath } from "../core/model.ts";
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

export interface ExplorationOptions {
  startUrl: string;
  actionPolicy?: ActionExecutionPolicy;
  maxTransitions?: number;
  fingerprinter?: StateFingerprinter;
}

export interface ExplorationResult {
  graph: StateGraph;
  rootPath: StatePath;
  attemptedTransitions: number;
}

async function restoreState(
  page: Page,
  startUrl: string,
  path: StatePath,
  fingerprinter: StateFingerprinter,
): Promise<void> {
  await page.goto(startUrl);

  for (const step of path.steps) {
    await executeInteraction(page, step.interaction);
    const snapshot = await observePage(page);
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
  const fingerprinter = options.fingerprinter ?? fingerprintState;
  const graph = new StateGraph(fingerprinter);
  const frontier = new BfsFrontier();
  const policy = options.actionPolicy ?? DEFAULT_ACTION_POLICY;
  const maxTransitions = options.maxTransitions ?? 1_000;

  await page.goto(options.startUrl);
  const initialSnapshot = await observePage(page);
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
      await restoreState(page, options.startUrl, work.replayPath, fingerprinter);
      const restored = graph.upsertState(await observePage(page));

      if (restored.node.id !== work.fromStateId) {
        throw new Error(
          `Replay restored ${restored.node.id}, expected ${work.fromStateId}`,
        );
      }

      await executeInteraction(page, work.interaction);
      const nextSnapshot = await observePage(page);
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

  return { graph, rootPath, attemptedTransitions };
}
