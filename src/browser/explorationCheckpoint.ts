import { createHash } from "node:crypto";

import type { BfsFrontierSnapshot } from "../core/frontier.ts";
import type { StateGraphSnapshot } from "../core/graph.ts";
import type { StatePath } from "../core/model.ts";

export interface ExplorationCheckpointPayload {
  schemaVersion: 1;
  startUrl: string;
  attemptedTransitions: number;
  rootPath: StatePath;
  graph: StateGraphSnapshot;
  frontier: BfsFrontierSnapshot;
  evidenceErrors: readonly string[];
}

export interface ExplorationCheckpointArtifact {
  schemaVersion: 1;
  kind: "statescout-exploration-checkpoint";
  payloadSha256: string;
  payload: ExplorationCheckpointPayload;
}

function payloadCanonical(
  payload: ExplorationCheckpointPayload,
): string {
  return JSON.stringify(payload);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createExplorationCheckpointArtifact(
  payload: ExplorationCheckpointPayload,
): ExplorationCheckpointArtifact {
  if (
    payload.schemaVersion !== 1 ||
    payload.startUrl.trim().length === 0 ||
    !Number.isInteger(payload.attemptedTransitions) ||
    payload.attemptedTransitions < 0
  ) {
    throw new Error("Invalid exploration checkpoint payload.");
  }

  return {
    schemaVersion: 1,
    kind: "statescout-exploration-checkpoint",
    payloadSha256: sha256(payloadCanonical(payload)),
    payload,
  };
}

export function serializeExplorationCheckpoint(
  artifact: ExplorationCheckpointArtifact,
): string {
  return JSON.stringify(artifact, null, 2) + "\n";
}

export function parseExplorationCheckpoint(
  serialized: string,
): ExplorationCheckpointArtifact {
  const parsed = JSON.parse(
    serialized,
  ) as Partial<ExplorationCheckpointArtifact>;

  if (
    parsed.schemaVersion !== 1 ||
    parsed.kind !== "statescout-exploration-checkpoint" ||
    typeof parsed.payloadSha256 !== "string" ||
    parsed.payload === undefined
  ) {
    throw new Error("Unsupported or invalid exploration checkpoint.");
  }

  const expected = sha256(
    payloadCanonical(parsed.payload),
  );

  if (expected !== parsed.payloadSha256) {
    throw new Error("Exploration checkpoint digest mismatch.");
  }

  return createExplorationCheckpointArtifact(parsed.payload);
}
