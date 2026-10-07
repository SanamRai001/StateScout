import type { CandidateBehaviorEvidence } from "./volatilityCandidates.ts";

export interface VolatilityBehaviorEvidenceStore {
  schemaVersion: 1;
  records: readonly CandidateBehaviorEvidence[];
}

function recordKey(record: CandidateBehaviorEvidence): string {
  return [
    record.sessionId,
    record.sourceAnchorHash,
    record.fieldValue,
    record.behaviorSignature,
  ].join("\u0000");
}

export function createVolatilityBehaviorEvidenceStore(
  records: readonly CandidateBehaviorEvidence[] = [],
): VolatilityBehaviorEvidenceStore {
  const unique = new Map<string, CandidateBehaviorEvidence>();

  for (const record of records) {
    unique.set(recordKey(record), record);
  }

  return {
    schemaVersion: 1,
    records: [...unique.values()].sort((a, b) =>
      recordKey(a).localeCompare(recordKey(b)),
    ),
  };
}

export function mergeVolatilityBehaviorEvidenceStores(
  ...stores: VolatilityBehaviorEvidenceStore[]
): VolatilityBehaviorEvidenceStore {
  return createVolatilityBehaviorEvidenceStore(
    stores.flatMap((store) => store.records),
  );
}

export function serializeVolatilityBehaviorEvidenceStore(
  store: VolatilityBehaviorEvidenceStore,
): string {
  return JSON.stringify(
    createVolatilityBehaviorEvidenceStore(store.records),
    null,
    2,
  ) + "\n";
}

export function parseVolatilityBehaviorEvidenceStore(
  serialized: string,
): VolatilityBehaviorEvidenceStore {
  const parsed = JSON.parse(serialized) as {
    schemaVersion?: unknown;
    records?: unknown;
  };

  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error("Unsupported or invalid volatility behavior evidence store.");
  }

  const records: CandidateBehaviorEvidence[] = [];

  for (const value of parsed.records) {
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as { sessionId?: unknown }).sessionId !== "string" ||
      typeof (value as { sourceAnchorHash?: unknown }).sourceAnchorHash !== "string" ||
      typeof (value as { fieldValue?: unknown }).fieldValue !== "string" ||
      typeof (value as { behaviorSignature?: unknown }).behaviorSignature !== "string"
    ) {
      throw new Error("Invalid volatility behavior evidence record.");
    }

    records.push({
      sessionId: (value as { sessionId: string }).sessionId,
      sourceAnchorHash: (value as { sourceAnchorHash: string }).sourceAnchorHash,
      fieldValue: (value as { fieldValue: string }).fieldValue,
      behaviorSignature: (value as { behaviorSignature: string }).behaviorSignature,
    });
  }

  return createVolatilityBehaviorEvidenceStore(records);
}
