import type { VolatilityField } from "./volatility.ts";

export interface RuleRevalidationEvidenceRecord {
  sessionId: string;
  field: VolatilityField;
  sourceAnchorHash: string;
  fieldValue: string;
  behaviorSignature: string;
}

export interface RuleRevalidationEvidenceStore {
  schemaVersion: 1;
  records: readonly RuleRevalidationEvidenceRecord[];
}

function recordKey(record: RuleRevalidationEvidenceRecord): string {
  return [
    record.sessionId,
    record.field,
    record.sourceAnchorHash,
    record.fieldValue,
    record.behaviorSignature,
  ].join("\u0000");
}

export function createRuleRevalidationEvidenceStore(
  records: readonly RuleRevalidationEvidenceRecord[] = [],
): RuleRevalidationEvidenceStore {
  const unique = new Map<string, RuleRevalidationEvidenceRecord>();

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

export function serializeRuleRevalidationEvidenceStore(
  store: RuleRevalidationEvidenceStore,
): string {
  return JSON.stringify(
    createRuleRevalidationEvidenceStore(store.records),
    null,
    2,
  ) + "\n";
}

export function parseRuleRevalidationEvidenceStore(
  serialized: string,
): RuleRevalidationEvidenceStore {
  const parsed = JSON.parse(serialized) as {
    schemaVersion?: unknown;
    records?: unknown;
  };

  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error("Unsupported or invalid rule revalidation evidence store.");
  }

  const records: RuleRevalidationEvidenceRecord[] = [];

  for (const value of parsed.records) {
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as { sessionId?: unknown }).sessionId !== "string" ||
      typeof (value as { field?: unknown }).field !== "string" ||
      typeof (value as { sourceAnchorHash?: unknown }).sourceAnchorHash !== "string" ||
      typeof (value as { fieldValue?: unknown }).fieldValue !== "string" ||
      typeof (value as { behaviorSignature?: unknown }).behaviorSignature !== "string"
    ) {
      throw new Error("Invalid rule revalidation evidence record.");
    }

    const field = (value as { field: string }).field;
    if (field !== "title" && !field.startsWith("query:")) {
      throw new Error(`Unsupported rule revalidation field: ${field}`);
    }

    records.push({
      sessionId: (value as { sessionId: string }).sessionId,
      field: field as VolatilityField,
      sourceAnchorHash: (value as { sourceAnchorHash: string }).sourceAnchorHash,
      fieldValue: (value as { fieldValue: string }).fieldValue,
      behaviorSignature: (value as { behaviorSignature: string }).behaviorSignature,
    });
  }

  return createRuleRevalidationEvidenceStore(records);
}
