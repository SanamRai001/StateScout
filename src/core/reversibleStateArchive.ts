import { createHash } from "node:crypto";

import { fingerprintState } from "./fingerprint.ts";
import type { StateFingerprinter } from "./graph.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
  StateFingerprint,
  TransitionStatus,
} from "./model.ts";

export interface RawObservationRecord {
  id: string;
  sessionId: string;
  observedAt: string;
  snapshot: SemanticStateSnapshot;
  strictFingerprint: StateFingerprint;
}

export interface RawTransitionRecord {
  id: string;
  fromObservationId: string;
  toObservationId?: string;
  interaction: Interaction;
  status: TransitionStatus;
  error?: string;
}

export interface RawStateArchive {
  schemaVersion: 1;
  observations: readonly RawObservationRecord[];
  transitions: readonly RawTransitionRecord[];
}

export interface ProjectedStateAlias {
  id: string;
  fingerprint: StateFingerprint;
  memberObservationIds: readonly string[];
}

export interface ProjectedTransitionAlias {
  id: string;
  fromStateId: string;
  toStateId?: string;
  interactionId: string;
  status: TransitionStatus;
  error?: string;
  rawTransitionIds: readonly string[];
}

export interface ProjectedStateGraph {
  states: readonly ProjectedStateAlias[];
  transitions: readonly ProjectedTransitionAlias[];
  observationToState: Readonly<Record<string, string>>;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function observationKey(record: RawObservationRecord): string {
  return record.id;
}

function transitionProjectionKey(input: {
  fromStateId: string;
  toStateId?: string;
  interactionId: string;
  status: TransitionStatus;
  error?: string;
}): string {
  return JSON.stringify([
    input.fromStateId,
    input.toStateId ?? null,
    input.interactionId,
    input.status,
    input.error ?? null,
  ]);
}

export function createRawObservation(
  input: Omit<RawObservationRecord, "strictFingerprint">,
): RawObservationRecord {
  if (input.id.trim().length === 0) {
    throw new Error("Raw observation id must not be empty.");
  }
  if (input.sessionId.trim().length === 0) {
    throw new Error("Raw observation sessionId must not be empty.");
  }

  return {
    ...input,
    strictFingerprint: fingerprintState(input.snapshot),
  };
}

export function createRawStateArchive(
  observations: readonly RawObservationRecord[],
  transitions: readonly RawTransitionRecord[],
): RawStateArchive {
  const observationById = new Map<string, RawObservationRecord>();

  for (const observation of observations) {
    const existing = observationById.get(observation.id);
    if (existing !== undefined) {
      if (
        JSON.stringify(existing) !== JSON.stringify(observation)
      ) {
        throw new Error(
          `Conflicting raw observation id: ${observation.id}`,
        );
      }
      continue;
    }
    observationById.set(observation.id, observation);
  }

  const transitionById = new Map<string, RawTransitionRecord>();

  for (const transition of transitions) {
    if (!observationById.has(transition.fromObservationId)) {
      throw new Error(
        `Unknown raw transition source: ${transition.fromObservationId}`,
      );
    }
    if (
      transition.toObservationId !== undefined &&
      !observationById.has(transition.toObservationId)
    ) {
      throw new Error(
        `Unknown raw transition destination: ${transition.toObservationId}`,
      );
    }

    const existing = transitionById.get(transition.id);
    if (
      existing !== undefined &&
      JSON.stringify(existing) !== JSON.stringify(transition)
    ) {
      throw new Error(
        `Conflicting raw transition id: ${transition.id}`,
      );
    }
    transitionById.set(transition.id, transition);
  }

  return {
    schemaVersion: 1,
    observations: [...observationById.values()].sort((a, b) =>
      observationKey(a).localeCompare(observationKey(b)),
    ),
    transitions: [...transitionById.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
  };
}

export function serializeRawStateArchive(
  archive: RawStateArchive,
): string {
  return JSON.stringify(
    createRawStateArchive(
      archive.observations,
      archive.transitions,
    ),
    null,
    2,
  ) + "\n";
}

export function rawStateArchiveSha256(
  archive: RawStateArchive,
): string {
  return hash(serializeRawStateArchive(archive));
}

export function parseRawStateArchive(
  serialized: string,
): RawStateArchive {
  const parsed = JSON.parse(serialized) as Partial<RawStateArchive>;

  if (
    parsed.schemaVersion !== 1 ||
    !Array.isArray(parsed.observations) ||
    !Array.isArray(parsed.transitions)
  ) {
    throw new Error("Unsupported or invalid raw state archive.");
  }

  return createRawStateArchive(
    parsed.observations as RawObservationRecord[],
    parsed.transitions as RawTransitionRecord[],
  );
}

export function projectRawStateArchive(
  archive: RawStateArchive,
  fingerprinter: StateFingerprinter,
): ProjectedStateGraph {
  const projectedByHash = new Map<
    string,
    {
      fingerprint: StateFingerprint;
      members: string[];
    }
  >();
  const observationToState: Record<string, string> = {};

  for (const observation of archive.observations) {
    const fingerprint = fingerprinter(observation.snapshot);
    const stateId = `alias:${fingerprint.hash}`;
    const existing = projectedByHash.get(fingerprint.hash);

    if (existing === undefined) {
      projectedByHash.set(fingerprint.hash, {
        fingerprint,
        members: [observation.id],
      });
    } else {
      existing.members.push(observation.id);
    }

    observationToState[observation.id] = stateId;
  }

  const states: ProjectedStateAlias[] = [
    ...projectedByHash.entries(),
  ]
    .map(([fingerprintHash, value]) => ({
      id: `alias:${fingerprintHash}`,
      fingerprint: value.fingerprint,
      memberObservationIds: [...value.members].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const projectedTransitions = new Map<
    string,
    {
      fromStateId: string;
      toStateId?: string;
      interactionId: string;
      status: TransitionStatus;
      error?: string;
      rawTransitionIds: string[];
    }
  >();

  for (const transition of archive.transitions) {
    const fromStateId =
      observationToState[transition.fromObservationId];
    if (fromStateId === undefined) {
      throw new Error(
        `Projection invariant violated for ${transition.fromObservationId}`,
      );
    }

    const toStateId =
      transition.toObservationId === undefined
        ? undefined
        : observationToState[transition.toObservationId];

    if (
      transition.toObservationId !== undefined &&
      toStateId === undefined
    ) {
      throw new Error(
        `Projection invariant violated for ${transition.toObservationId}`,
      );
    }

    const key = transitionProjectionKey({
      fromStateId,
      ...(toStateId !== undefined ? { toStateId } : {}),
      interactionId: transition.interaction.id,
      status: transition.status,
      ...(transition.error !== undefined
        ? { error: transition.error }
        : {}),
    });

    const existing = projectedTransitions.get(key);
    if (existing === undefined) {
      projectedTransitions.set(key, {
        fromStateId,
        ...(toStateId !== undefined ? { toStateId } : {}),
        interactionId: transition.interaction.id,
        status: transition.status,
        ...(transition.error !== undefined
          ? { error: transition.error }
          : {}),
        rawTransitionIds: [transition.id],
      });
    } else {
      existing.rawTransitionIds.push(transition.id);
    }
  }

  const transitions: ProjectedTransitionAlias[] = [
    ...projectedTransitions.entries(),
  ]
    .map(([key, value]) => ({
      id: `alias-transition:${hash(key)}`,
      fromStateId: value.fromStateId,
      ...(value.toStateId !== undefined
        ? { toStateId: value.toStateId }
        : {}),
      interactionId: value.interactionId,
      status: value.status,
      ...(value.error !== undefined ? { error: value.error } : {}),
      rawTransitionIds: [...value.rawTransitionIds].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    states,
    transitions,
    observationToState,
  };
}
