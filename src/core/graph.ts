import { createHash } from "node:crypto";

import { fingerprintState } from "./fingerprint.ts";
import type {
  Interaction,
  StateFingerprint,
  SemanticStateSnapshot,
  StateId,
  StateNode,
  Transition,
  TransitionStatus,
} from "./model.ts";

export type StateFingerprinter = (snapshot: SemanticStateSnapshot) => StateFingerprint;

export interface UpsertStateOptions {
  capturedAt?: string;
  screenshotPath?: string;
}

export interface UpsertStateResult {
  node: StateNode;
  isNew: boolean;
}

export interface AddTransitionInput {
  fromStateId: StateId;
  toStateId?: StateId;
  interaction: Interaction;
  status: TransitionStatus;
  error?: string;
}

export interface StateGraphSnapshot {
  schemaVersion: 1;
  states: readonly StateNode[];
  transitions: readonly Transition[];
}

function transitionId(input: AddTransitionInput): string {
  const identity = JSON.stringify([
    input.fromStateId,
    input.interaction.id,
    input.toStateId ?? null,
    input.status,
    input.error ?? null,
  ]);

  return `transition:${createHash("sha256").update(identity).digest("hex")}`;
}

export class StateGraph {
  private readonly statesById = new Map<StateId, StateNode>();
  private readonly stateIdsByHash = new Map<string, StateId>();
  private readonly transitionsById = new Map<string, Transition>();
  private readonly fingerprinter: StateFingerprinter;

  constructor(fingerprinter: StateFingerprinter = fingerprintState) {
    this.fingerprinter = fingerprinter;
  }

  static fromSnapshot(
    snapshot: StateGraphSnapshot,
    fingerprinter: StateFingerprinter = fingerprintState,
  ): StateGraph {
    if (
      snapshot.schemaVersion !== 1 ||
      !Array.isArray(snapshot.states) ||
      !Array.isArray(snapshot.transitions)
    ) {
      throw new Error("Unsupported or invalid state graph snapshot.");
    }

    const graph = new StateGraph(fingerprinter);

    for (const state of [...snapshot.states].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      const expected = fingerprinter(state.snapshot);
      const expectedId = `state:${expected.hash}`;

      if (
        state.id !== expectedId ||
        state.fingerprint.hash !== expected.hash ||
        state.fingerprint.canonical !== expected.canonical ||
        state.fingerprint.version !== expected.version ||
        state.fingerprint.algorithm !== expected.algorithm
      ) {
        throw new Error(
          `State graph snapshot fingerprint mismatch: ${state.id}`,
        );
      }

      if (
        graph.statesById.has(state.id) ||
        graph.stateIdsByHash.has(state.fingerprint.hash)
      ) {
        throw new Error(
          `Duplicate state graph snapshot state: ${state.id}`,
        );
      }

      graph.statesById.set(state.id, state);
      graph.stateIdsByHash.set(state.fingerprint.hash, state.id);
    }

    for (const transition of [...snapshot.transitions].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      const restored = graph.addTransition({
        fromStateId: transition.fromStateId,
        ...(transition.toStateId !== undefined
          ? { toStateId: transition.toStateId }
          : {}),
        interaction: transition.interaction,
        status: transition.status,
        ...(transition.error !== undefined
          ? { error: transition.error }
          : {}),
      });

      if (restored.id !== transition.id) {
        throw new Error(
          `State graph snapshot transition mismatch: ${transition.id}`,
        );
      }
    }

    return graph;
  }

  upsertState(
    snapshot: SemanticStateSnapshot,
    options: UpsertStateOptions = {},
  ): UpsertStateResult {
    const fingerprint = this.fingerprinter(snapshot);
    const existingId = this.stateIdsByHash.get(fingerprint.hash);

    if (existingId !== undefined) {
      const existing = this.statesById.get(existingId);

      if (existing === undefined) {
        throw new Error(
          `State graph invariant violated: missing state ${existingId}`,
        );
      }

      return { node: existing, isNew: false };
    }

    const id = `state:${fingerprint.hash}`;
    const node: StateNode = {
      id,
      fingerprint,
      snapshot,
      capturedAt: options.capturedAt ?? new Date().toISOString(),
      ...(options.screenshotPath !== undefined
        ? { screenshotPath: options.screenshotPath }
        : {}),
    };

    this.statesById.set(id, node);
    this.stateIdsByHash.set(fingerprint.hash, id);

    return { node, isNew: true };
  }

  addTransition(input: AddTransitionInput): Transition {
    if (!this.statesById.has(input.fromStateId)) {
      throw new Error(`Unknown source state: ${input.fromStateId}`);
    }

    if (
      input.toStateId !== undefined &&
      !this.statesById.has(input.toStateId)
    ) {
      throw new Error(`Unknown destination state: ${input.toStateId}`);
    }

    const id = transitionId(input);
    const existing = this.transitionsById.get(id);

    if (existing !== undefined) {
      return existing;
    }

    const transition: Transition = {
      id,
      fromStateId: input.fromStateId,
      interaction: input.interaction,
      status: input.status,
      ...(input.toStateId !== undefined ? { toStateId: input.toStateId } : {}),
      ...(input.error !== undefined ? { error: input.error } : {}),
    };

    this.transitionsById.set(id, transition);
    return transition;
  }

  getState(id: StateId): StateNode | undefined {
    return this.statesById.get(id);
  }

  getStateByHash(hash: string): StateNode | undefined {
    const id = this.stateIdsByHash.get(hash);
    return id === undefined ? undefined : this.statesById.get(id);
  }

  listStates(): readonly StateNode[] {
    return [...this.statesById.values()];
  }

  listTransitions(): readonly Transition[] {
    return [...this.transitionsById.values()];
  }

  exportSnapshot(): StateGraphSnapshot {
    return {
      schemaVersion: 1,
      states: [...this.listStates()].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
      transitions: [...this.listTransitions()].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    };
  }

  get stateCount(): number {
    return this.statesById.size;
  }

  get transitionCount(): number {
    return this.transitionsById.size;
  }
}
