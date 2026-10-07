import type { SemanticStateSnapshot } from "./model.ts";
import {
  isKnownTrackingQueryKey,
  volatilityAnchorHash,
  type VolatilityField,
} from "./volatility.ts";
import {
  type VolatilityCandidate,
  volatilityFieldValue,
} from "./volatilityCandidates.ts";

export interface VolatilityEvidenceRecord {
  sessionId: string;
  field: VolatilityField;
  anchorHash: string;
  value: string;
}

export interface VolatilityEvidenceStore {
  schemaVersion: 1;
  records: readonly VolatilityEvidenceRecord[];
}

function recordKey(record: VolatilityEvidenceRecord): string {
  return [
    record.sessionId,
    record.field,
    record.anchorHash,
    record.value,
  ].join("\u0000");
}

function sortRecords(
  records: readonly VolatilityEvidenceRecord[],
): VolatilityEvidenceRecord[] {
  return [...records].sort((a, b) => recordKey(a).localeCompare(recordKey(b)));
}

export function createVolatilityEvidenceStore(
  records: readonly VolatilityEvidenceRecord[] = [],
): VolatilityEvidenceStore {
  const unique = new Map<string, VolatilityEvidenceRecord>();

  for (const record of records) {
    unique.set(recordKey(record), record);
  }

  return {
    schemaVersion: 1,
    records: sortRecords([...unique.values()]),
  };
}

export function mergeVolatilityEvidenceStores(
  ...stores: VolatilityEvidenceStore[]
): VolatilityEvidenceStore {
  return createVolatilityEvidenceStore(
    stores.flatMap((store) => store.records),
  );
}

export function serializeVolatilityEvidenceStore(
  store: VolatilityEvidenceStore,
): string {
  return JSON.stringify(createVolatilityEvidenceStore(store.records), null, 2) + "\n";
}

export function parseVolatilityEvidenceStore(
  serialized: string,
): VolatilityEvidenceStore {
  const parsed = JSON.parse(serialized) as {
    schemaVersion?: unknown;
    records?: unknown;
  };

  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error("Unsupported or invalid volatility evidence store.");
  }

  const records: VolatilityEvidenceRecord[] = [];

  for (const value of parsed.records) {
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as { sessionId?: unknown }).sessionId !== "string" ||
      typeof (value as { field?: unknown }).field !== "string" ||
      typeof (value as { anchorHash?: unknown }).anchorHash !== "string" ||
      typeof (value as { value?: unknown }).value !== "string"
    ) {
      throw new Error("Invalid volatility evidence record.");
    }

    const field = (value as { field: string }).field;
    if (field !== "title" && !field.startsWith("query:")) {
      throw new Error(`Unsupported volatility evidence field: ${field}`);
    }

    records.push({
      sessionId: (value as { sessionId: string }).sessionId,
      field: field as VolatilityField,
      anchorHash: (value as { anchorHash: string }).anchorHash,
      value: (value as { value: string }).value,
    });
  }

  return createVolatilityEvidenceStore(records);
}

export class VolatilityEvidenceCollector {
  private readonly sessionId: string;
  private readonly records = new Map<string, VolatilityEvidenceRecord>();

  constructor(sessionId: string) {
    if (sessionId.trim().length === 0) {
      throw new Error("Evidence collector sessionId must not be empty.");
    }
    this.sessionId = sessionId;
  }

  observe(snapshot: SemanticStateSnapshot): void {
    const fields: VolatilityField[] = [];

    if (snapshot.title !== undefined) {
      fields.push("title");
    }

    for (const key of Object.keys(snapshot.query).sort()) {
      if (!isKnownTrackingQueryKey(key)) {
        fields.push(`query:${key}`);
      }
    }

    for (const field of fields) {
      const record: VolatilityEvidenceRecord = {
        sessionId: this.sessionId,
        field,
        anchorHash: volatilityAnchorHash(snapshot, field),
        value: volatilityFieldValue(snapshot, field),
      };
      this.records.set(recordKey(record), record);
    }
  }

  toStore(): VolatilityEvidenceStore {
    return createVolatilityEvidenceStore([...this.records.values()]);
  }
}

export function discoverQuarantinedCandidates(
  store: VolatilityEvidenceStore,
): readonly VolatilityCandidate[] {
  const groups = new Map<string, VolatilityEvidenceRecord[]>();

  for (const record of store.records) {
    const key = `${record.field}\u0000${record.anchorHash}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  const candidates: VolatilityCandidate[] = [];

  for (const records of groups.values()) {
    const distinctValues = [...new Set(records.map((record) => record.value))].sort();
    if (distinctValues.length < 2) continue;

    const first = records[0]!;
    candidates.push({
      field: first.field,
      anchorHash: first.anchorHash,
      observationCount: records.length,
      sessionIds: [...new Set(records.map((record) => record.sessionId))].sort(),
      distinctValues,
      status: "quarantined",
    });
  }

  return candidates.sort((a, b) =>
    `${a.field}:${a.anchorHash}`.localeCompare(`${b.field}:${b.anchorHash}`),
  );
}
