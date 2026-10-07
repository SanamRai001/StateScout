import { createHash } from "node:crypto";

import type { SemanticControl, SemanticStateSnapshot } from "./model.ts";

export type VolatilityField = "title" | `query:${string}`;

export interface ScopedVolatilityRule {
  field: VolatilityField;
  anchorHash: string;
  sampleCount: number;
  distinctValues: readonly string[];
  provenance: "trusted-repeated-observation";
}

export interface VolatilityProfile {
  version: 1;
  rules: readonly ScopedVolatilityRule[];
}

const KNOWN_TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

function normalizeText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeList(values: readonly string[]): string[] {
  return values
    .map(normalizeText)
    .filter((value): value is string => value !== undefined)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeControl(control: SemanticControl): SemanticControl {
  const name = normalizeText(control.name);
  const label = normalizeText(control.label);
  const value = normalizeText(control.value);
  const context = normalizeText(control.context);

  return {
    role: control.role.trim().toLowerCase(),
    ...(name ? { name } : {}),
    ...(label ? { label } : {}),
    ...(value ? { value } : {}),
    ...(control.selected !== undefined ? { selected: control.selected } : {}),
    ...(control.expanded !== undefined ? { expanded: control.expanded } : {}),
    ...(control.checked !== undefined ? { checked: control.checked } : {}),
    ...(control.disabled !== undefined ? { disabled: control.disabled } : {}),
    ...(context ? { context } : {}),
  };
}

function controlKey(control: SemanticControl): string {
  return JSON.stringify([
    control.role,
    control.name ?? null,
    control.label ?? null,
    control.value ?? null,
    control.selected ?? null,
    control.expanded ?? null,
    control.checked ?? null,
    control.disabled ?? null,
    control.context ?? null,
  ]);
}

function normalizedQuery(
  snapshot: SemanticStateSnapshot,
  excludedField?: VolatilityField,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  const excludedQueryKey = excludedField?.startsWith("query:")
    ? excludedField.slice("query:".length).toLowerCase()
    : undefined;

  for (const [key, value] of Object.entries(snapshot.query).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const lowerKey = key.toLowerCase();
    if (KNOWN_TRACKING_QUERY_KEYS.has(lowerKey)) continue;
    if (excludedQueryKey === lowerKey) continue;
    query[key] = typeof value === "string" ? value : [...value].sort();
  }

  return query;
}

export function volatilityAnchorCanonical(
  snapshot: SemanticStateSnapshot,
  excludedField: VolatilityField,
): string {
  const controls = snapshot.controls
    .map(normalizeControl)
    .sort((a, b) => controlKey(a).localeCompare(controlKey(b)));

  return JSON.stringify({
    origin: snapshot.origin.toLowerCase(),
    path: snapshot.path || "/",
    query: normalizedQuery(snapshot, excludedField),
    ...(excludedField === "title"
      ? {}
      : { title: normalizeText(snapshot.title) }),
    headings: normalizeList(snapshot.headings),
    landmarks: normalizeList(snapshot.landmarks),
    dialogs: normalizeList(snapshot.dialogs),
    controls,
  });
}

export function volatilityAnchorHash(
  snapshot: SemanticStateSnapshot,
  excludedField: VolatilityField,
): string {
  return createHash("sha256")
    .update(volatilityAnchorCanonical(snapshot, excludedField))
    .digest("hex");
}

function fieldValue(
  snapshot: SemanticStateSnapshot,
  field: VolatilityField,
): string {
  if (field === "title") {
    return normalizeText(snapshot.title) ?? "<absent>";
  }

  const requested = field.slice("query:".length).toLowerCase();
  const match = Object.entries(snapshot.query).find(
    ([key]) => key.toLowerCase() === requested,
  );

  if (!match) return "<absent>";
  const [, value] = match;
  return typeof value === "string"
    ? value
    : JSON.stringify([...value].sort());
}

export function learnScopedVolatilityRule(
  snapshots: readonly SemanticStateSnapshot[],
  field: VolatilityField,
): ScopedVolatilityRule {
  if (snapshots.length < 2) {
    throw new Error("Volatility learning requires at least two trusted observations.");
  }

  const anchors = snapshots.map((snapshot) =>
    volatilityAnchorHash(snapshot, field),
  );
  const uniqueAnchors = new Set(anchors);

  if (uniqueAnchors.size !== 1) {
    throw new Error(
      `Cannot learn volatility for ${field}: protected semantic anchor changed across observations.`,
    );
  }

  const distinctValues = [...new Set(
    snapshots.map((snapshot) => fieldValue(snapshot, field)),
  )].sort();

  if (distinctValues.length < 2) {
    throw new Error(
      `Cannot learn volatility for ${field}: field did not vary across observations.`,
    );
  }

  return {
    field,
    anchorHash: anchors[0]!,
    sampleCount: snapshots.length,
    distinctValues,
    provenance: "trusted-repeated-observation",
  };
}

export function createVolatilityProfile(
  rules: readonly ScopedVolatilityRule[],
): VolatilityProfile {
  const unique = new Map<string, ScopedVolatilityRule>();

  for (const rule of rules) {
    unique.set(`${rule.field}:${rule.anchorHash}`, rule);
  }

  return {
    version: 1,
    rules: [...unique.values()].sort((a, b) =>
      `${a.field}:${a.anchorHash}`.localeCompare(
        `${b.field}:${b.anchorHash}`,
      ),
    ),
  };
}

export function hasTrustedVolatilityRule(
  profile: VolatilityProfile,
  snapshot: SemanticStateSnapshot,
  field: VolatilityField,
): boolean {
  const anchorHash = volatilityAnchorHash(snapshot, field);
  return profile.rules.some(
    (rule) =>
      rule.field === field &&
      rule.anchorHash === anchorHash &&
      rule.provenance === "trusted-repeated-observation",
  );
}

export function isKnownTrackingQueryKey(key: string): boolean {
  return KNOWN_TRACKING_QUERY_KEYS.has(key.toLowerCase());
}
