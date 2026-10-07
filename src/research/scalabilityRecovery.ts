import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import { BfsFrontier } from "../core/frontier.ts";
import { fingerprintState } from "../core/fingerprint.ts";
import { StateGraph } from "../core/graph.ts";
import type {
  Interaction,
  SemanticControl,
  SemanticStateSnapshot,
  StatePath,
} from "../core/model.ts";
import {
  createExplorationCheckpointArtifact,
  parseExplorationCheckpoint,
  serializeExplorationCheckpoint,
  type ExplorationCheckpointArtifact,
} from "../browser/explorationCheckpoint.ts";

const FAILURE_INTERVAL = 16;
const FAILURE_ERROR = "Injected Phase 20 probe failure";

export interface SyntheticExplorationResult {
  graph: StateGraph;
  rootPath: StatePath;
  attemptedTransitions: number;
  checkpoint: ExplorationCheckpointArtifact;
  graphSignature: string;
  failedTransitions: number;
}

export interface SyntheticScaleMeasurement {
  states: number;
  transitions: number;
  attempts: number;
  failedTransitions: number;
  durationMs: number;
  heapDeltaBytes: number;
  graphSignature: string;
}

function startUrl(stateCount: number): string {
  return `https://phase20.statescout.local/?states=${stateCount}`;
}

function controlsForState(
  index: number,
  stateCount: number,
): SemanticControl[] {
  const controls: SemanticControl[] = [];

  if (index < stateCount - 1) {
    controls.push({
      role: "button",
      name: "Advance",
    });
  }

  if (index % FAILURE_INTERVAL === 0) {
    controls.push({
      role: "button",
      name: "Probe failure",
    });
  }

  return controls;
}

function snapshotForState(
  index: number,
  stateCount: number,
): SemanticStateSnapshot {
  return {
    origin: "https://phase20.statescout.local",
    path: `/state/${index}`,
    query: {},
    title: `Synthetic state ${index}`,
    headings: [`Synthetic state ${index}`],
    landmarks: ["main"],
    dialogs: [],
    controls: controlsForState(index, stateCount),
  };
}

function interaction(
  id: string,
  name: string,
): Interaction {
  return {
    id,
    kind: "click",
    risk: "safe",
    target: {
      role: "button",
      name,
    },
    locatorCandidates: [
      {
        strategy: "role",
        value: JSON.stringify(["button", name]),
        score: 1,
      },
    ],
  };
}

function interactionsForState(
  index: number,
  stateCount: number,
): Interaction[] {
  const interactions: Interaction[] = [];

  if (index < stateCount - 1) {
    interactions.push(interaction("advance", "Advance"));
  }

  if (index % FAILURE_INTERVAL === 0) {
    interactions.push(
      interaction("probe-failure", "Probe failure"),
    );
  }

  return interactions;
}

function stateIndex(snapshot: SemanticStateSnapshot): number {
  const match = /^\/state\/(\d+)$/.exec(snapshot.path);

  if (!match) {
    throw new Error(
      `Unexpected synthetic state path: ${snapshot.path}`,
    );
  }

  return Number(match[1]);
}

function enqueueStateInteractions(
  frontier: BfsFrontier,
  stateId: string,
  path: StatePath,
  index: number,
  stateCount: number,
): void {
  for (const candidate of interactionsForState(index, stateCount)) {
    frontier.enqueue({
      fromStateId: stateId,
      interaction: candidate,
      replayPath: path,
    });
  }
}

export function canonicalGraphSignature(
  graph: StateGraph,
): string {
  const canonical = JSON.stringify({
    states: graph
      .listStates()
      .map((state) => state.fingerprint.hash)
      .sort(),
    transitions: graph
      .listTransitions()
      .map((transition) => [
        transition.fromStateId,
        transition.toStateId ?? null,
        transition.interaction.id,
        transition.status,
        transition.error ?? null,
      ])
      .sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      ),
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export function runSyntheticExploration(
  stateCount: number,
  options: {
    maxAttempts?: number;
    resumeFrom?: ExplorationCheckpointArtifact;
  } = {},
): SyntheticExplorationResult {
  if (!Number.isInteger(stateCount) || stateCount < 1) {
    throw new Error("stateCount must be a positive integer.");
  }

  const expectedStartUrl = startUrl(stateCount);
  const maxAttempts =
    options.maxAttempts ?? Number.POSITIVE_INFINITY;

  if (
    options.resumeFrom !== undefined &&
    options.resumeFrom.payload.startUrl !== expectedStartUrl
  ) {
    throw new Error(
      "Synthetic checkpoint state-count/start URL mismatch.",
    );
  }

  const graph =
    options.resumeFrom === undefined
      ? new StateGraph(fingerprintState)
      : StateGraph.fromSnapshot(
          options.resumeFrom.payload.graph,
          fingerprintState,
        );
  const frontier =
    options.resumeFrom === undefined
      ? new BfsFrontier()
      : BfsFrontier.fromSnapshot(
          options.resumeFrom.payload.frontier,
        );

  let rootPath: StatePath;
  let attemptedTransitions: number;

  if (options.resumeFrom === undefined) {
    const initial = graph.upsertState(
      snapshotForState(0, stateCount),
    );
    rootPath = {
      stateId: initial.node.id,
      steps: [],
    };
    enqueueStateInteractions(
      frontier,
      initial.node.id,
      rootPath,
      0,
      stateCount,
    );
    attemptedTransitions = 0;
  } else {
    rootPath = options.resumeFrom.payload.rootPath;
    attemptedTransitions =
      options.resumeFrom.payload.attemptedTransitions;
  }

  while (
    frontier.size > 0 &&
    attemptedTransitions < maxAttempts
  ) {
    const work = frontier.dequeue();
    if (!work) break;

    attemptedTransitions += 1;

    const source = graph.getState(work.fromStateId);
    if (!source) {
      throw new Error(
        `Synthetic source state missing: ${work.fromStateId}`,
      );
    }

    const index = stateIndex(source.snapshot);

    if (work.interaction.id === "probe-failure") {
      graph.addTransition({
        fromStateId: work.fromStateId,
        interaction: work.interaction,
        status: "failed",
        error: FAILURE_ERROR,
      });
      continue;
    }

    if (work.interaction.id !== "advance") {
      throw new Error(
        `Unexpected synthetic interaction: ${work.interaction.id}`,
      );
    }

    const nextIndex = index + 1;
    if (nextIndex >= stateCount) {
      throw new Error(
        `Synthetic advance exceeded state count at ${index}`,
      );
    }

    const next = graph.upsertState(
      snapshotForState(nextIndex, stateCount),
    );

    graph.addTransition({
      fromStateId: work.fromStateId,
      toStateId: next.node.id,
      interaction: work.interaction,
      status: "observed",
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

      enqueueStateInteractions(
        frontier,
        next.node.id,
        nextPath,
        nextIndex,
        stateCount,
      );
    }
  }

  const checkpoint = createExplorationCheckpointArtifact({
    schemaVersion: 1,
    startUrl: expectedStartUrl,
    attemptedTransitions,
    rootPath,
    graph: graph.exportSnapshot(),
    frontier: frontier.exportSnapshot(),
    evidenceErrors: [],
  });

  return {
    graph,
    rootPath,
    attemptedTransitions,
    checkpoint,
    graphSignature: canonicalGraphSignature(graph),
    failedTransitions: graph
      .listTransitions()
      .filter((transition) => transition.status === "failed")
      .length,
  };
}

export function measureSyntheticScale(
  stateCount: number,
): SyntheticScaleMeasurement {
  const heapBefore = process.memoryUsage().heapUsed;
  const started = performance.now();
  const result = runSyntheticExploration(stateCount);
  const durationMs = performance.now() - started;
  const heapAfter = process.memoryUsage().heapUsed;

  return {
    states: result.graph.stateCount,
    transitions: result.graph.transitionCount,
    attempts: result.attemptedTransitions,
    failedTransitions: result.failedTransitions,
    durationMs,
    heapDeltaBytes: heapAfter - heapBefore,
    graphSignature: result.graphSignature,
  };
}

export function verifySyntheticCheckpointRecovery(
  stateCount: number,
  interruptAfterAttempts: number,
): {
  uninterrupted: SyntheticExplorationResult;
  partial: SyntheticExplorationResult;
  resumed: SyntheticExplorationResult;
  serializedCheckpointBytes: number;
  resumedMatchesUninterrupted: boolean;
  corruptedCheckpointRejected: boolean;
} {
  const uninterrupted = runSyntheticExploration(stateCount);
  const partial = runSyntheticExploration(stateCount, {
    maxAttempts: interruptAfterAttempts,
  });

  const serialized = serializeExplorationCheckpoint(
    partial.checkpoint,
  );
  const parsed = parseExplorationCheckpoint(serialized);
  const resumed = runSyntheticExploration(stateCount, {
    resumeFrom: parsed,
  });

  const tampered = JSON.parse(serialized) as {
    payload: { attemptedTransitions: number };
  };
  tampered.payload.attemptedTransitions += 1;

  let corruptedCheckpointRejected = false;
  try {
    parseExplorationCheckpoint(
      JSON.stringify(tampered),
    );
  } catch (error) {
    corruptedCheckpointRejected =
      error instanceof Error &&
      /digest mismatch/.test(error.message);
  }

  return {
    uninterrupted,
    partial,
    resumed,
    serializedCheckpointBytes: Buffer.byteLength(
      serialized,
      "utf8",
    ),
    resumedMatchesUninterrupted:
      resumed.graphSignature === uninterrupted.graphSignature &&
      resumed.attemptedTransitions ===
        uninterrupted.attemptedTransitions,
    corruptedCheckpointRejected,
  };
}
