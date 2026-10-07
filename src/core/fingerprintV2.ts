import { createHash } from "node:crypto";

import type { SemanticControl, SemanticStateSnapshot, StateFingerprint } from "./model.ts";

const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

const TIME_TOKEN = /\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s?[AP]M)?\b/gi;

function normalizeText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeVolatileTitle(value: string | undefined): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const withoutTime = normalized.replace(TIME_TOKEN, "<time>").replace(/\s+/g, " ").trim();
  return withoutTime || undefined;
}

function normalizeList(values: readonly string[]): string[] {
  return values
    .map(normalizeText)
    .filter((value): value is string => value !== undefined)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeQuery(query: SemanticStateSnapshot["query"]): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(query).sort(([a], [b]) => a.localeCompare(b))) {
    if (TRACKING_QUERY_KEYS.has(key.toLowerCase())) continue;
    normalized[key] = typeof value === "string" ? value : [...value].sort();
  }
  return normalized;
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
    control.role, control.name ?? null, control.label ?? null, control.value ?? null,
    control.selected ?? null, control.expanded ?? null, control.checked ?? null,
    control.disabled ?? null, control.context ?? null,
  ]);
}

export function canonicalizeStateV2(snapshot: SemanticStateSnapshot): string {
  const controls = snapshot.controls.map(normalizeControl).sort((a, b) => controlKey(a).localeCompare(controlKey(b)));
  return JSON.stringify({
    origin: snapshot.origin.toLowerCase(),
    path: snapshot.path || "/",
    query: normalizeQuery(snapshot.query),
    title: normalizeVolatileTitle(snapshot.title),
    headings: normalizeList(snapshot.headings),
    landmarks: normalizeList(snapshot.landmarks),
    dialogs: normalizeList(snapshot.dialogs),
    controls,
  });
}

export function fingerprintStateV2(snapshot: SemanticStateSnapshot): StateFingerprint {
  const canonical = canonicalizeStateV2(snapshot);
  return {
    algorithm: "statescout-semantic",
    version: 2,
    canonical,
    hash: createHash("sha256").update(canonical).digest("hex"),
  };
}
