import type { Page } from "playwright";

import { BfsFrontier } from "../core/frontier.ts";
import { StateGraph, type StateFingerprinter } from "../core/graph.ts";
import {
  createExplorationCheckpointArtifact,
  type ExplorationCheckpointArtifact,
} from "./explorationCheckpoint.ts";
import { fingerprintState } from "../core/fingerprint.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
  StatePath,
} from "../core/model.ts";
import {
  DEFAULT_ACTION_POLICY,
  canExecuteInteraction,
  isUrlAllowed,
  type ActionExecutionPolicy,
  type CrawlBoundaryPolicy,
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
  resumeFrom?: ExplorationCheckpointArtifact;
  checkpointSink?: (
    checkpoint: ExplorationCheckpointArtifact,
  ) => void;
}

export interface ExplorationResult {
  graph: StateGraph;
  rootPath: StatePath;
  attemptedTransitions: number;
  evidenceErrors: readonly string[];
  checkpoint: ExplorationCheckpointArtifact;
}

function sameDocumentTarget(currentUrl: string, targetUrl: string): boolean {
  try {
    const current = new URL(currentUrl);
    const target = new URL(targetUrl);

    return (
      current.origin === target.origin &&
      current.pathname === target.pathname &&
      current.search === target.search
    );
  } catch {
    return false;
  }
}

async function navigateToStartState(
  page: Page,
  startUrl: string,
): Promise<void> {
  const currentUrl = page.url();

  if (sameDocumentTarget(currentUrl, startUrl)) {
    if (currentUrl !== startUrl) {
      await page.goto(startUrl);
    }
    await page.reload();
    return;
  }

  await page.goto(startUrl);
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
  await navigateToStartState(page, startUrl);

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

function canNavigateWithinBoundary(
  interaction: Interaction,
  boundary: CrawlBoundaryPolicy,
): boolean {
  if (
    interaction.kind !== "navigate" ||
    !interaction.target.href
  ) {
    return true;
  }

  const start = new URL(boundary.startUrl);
  const candidate = new URL(
    interaction.target.href,
    boundary.startUrl,
  );

  if (start.protocol === "http:" || start.protocol === "https:") {
    return isUrlAllowed(candidate.href, boundary);
  }

  // Local file fixtures are allowed to navigate only to another file URL.
  // Production/public web exploration remains governed by strict same-origin
  // HTTP(S) policy through isUrlAllowed().
  return (
    start.protocol === "file:" &&
    candidate.protocol === "file:"
  );
}

function enqueueInteractions(
  frontier: BfsFrontier,
  stateId: string,
  path: StatePath,
  interactions: readonly Interaction[],
  policy: ActionExecutionPolicy,
  boundary: CrawlBoundaryPolicy,
  graph: StateGraph,
): void {
  for (const interaction of interactions) {
    if (
      !canExecuteInteraction(interaction, policy) ||
      !canNavigateWithinBoundary(interaction, boundary)
    ) {
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
  const policy = options.actionPolicy ?? DEFAULT_ACTION_POLICY;
  const boundary: CrawlBoundaryPolicy = {
    mode: "same-origin",
    startUrl: options.startUrl,
  };
  const maxTransitions = options.maxTransitions ?? 1_000;

  if (
    options.resumeFrom !== undefined &&
    options.resumeFrom.payload.startUrl !== options.startUrl
  ) {
    throw new Error(
      "Exploration checkpoint start URL does not match this run.",
    );
  }

  const graph =
    options.resumeFrom === undefined
      ? new StateGraph(runFingerprinter)
      : StateGraph.fromSnapshot(
          options.resumeFrom.payload.graph,
          runFingerprinter,
        );
  const frontier =
    options.resumeFrom === undefined
      ? new BfsFrontier()
      : BfsFrontier.fromSnapshot(
          options.resumeFrom.payload.frontier,
        );
  const evidenceErrors: string[] =
    options.resumeFrom === undefined
      ? []
      : [...options.resumeFrom.payload.evidenceErrors];

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

  let rootPath: StatePath;
  let attemptedTransitions: number;

  if (options.resumeFrom === undefined) {
    await navigateToStartState(page, options.startUrl);
    const initialSnapshot = await observeForRun("initial");
    const initial = graph.upsertState(initialSnapshot);
    rootPath = { stateId: initial.node.id, steps: [] };

    enqueueInteractions(
      frontier,
      initial.node.id,
      rootPath,
      await discoverInteractions(page),
      policy,
      boundary,
      graph,
    );

    attemptedTransitions = 0;
  } else {
    rootPath = options.resumeFrom.payload.rootPath;
    attemptedTransitions =
      options.resumeFrom.payload.attemptedTransitions;

    if (graph.getState(rootPath.stateId) === undefined) {
      throw new Error(
        "Exploration checkpoint root state is missing from the graph.",
      );
    }
  }

  const createCheckpoint = () =>
    createExplorationCheckpointArtifact({
      schemaVersion: 1,
      startUrl: options.startUrl,
      attemptedTransitions,
      rootPath,
      graph: graph.exportSnapshot(),
      frontier: frontier.exportSnapshot(),
      evidenceErrors,
    });

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
          boundary,
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

    if (options.checkpointSink) {
      options.checkpointSink(createCheckpoint());
    }
  }

  const checkpoint = createCheckpoint();

  return {
    graph,
    rootPath,
    attemptedTransitions,
    evidenceErrors,
    checkpoint,
  };
}
