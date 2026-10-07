import { createHash } from "node:crypto";

import type {
  SemanticControl,
  SemanticStateSnapshot,
  StateFingerprint,
} from "./model.ts";
import type { StateFingerprinter } from "./graph.ts";
import {
  hasTrustedVolatilityRule,
  isKnownTrackingQueryKey,
  type VolatilityProfile,
} from "./volatility.ts";

const EMPTY_PROFILE: VolatilityProfile = {
  version: 1,
  rules: [],
};

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

function normalizeQuery(
  snapshot: SemanticStateSnapshot,
  profile: VolatilityProfile,
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(snapshot.query).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (isKnownTrackingQueryKey(key)) continue;

    const field = `query:${key}` as const;
    if (hasTrustedVolatilityRule(profile, snapshot, field)) {
      normalized[key] = "<volatile>";
      continue;
    }

    normalized[key] =
      typeof value === "string" ? value : [...value].sort();
  }

  return normalized;
}

export function canonicalizeStateV4(
  snapshot: SemanticStateSnapshot,
  profile: VolatilityProfile = EMPTY_PROFILE,
): string {
  const controls = snapshot.controls
    .map(normalizeControl)
    .sort((a, b) => controlKey(a).localeCompare(controlKey(b)));

  const title = hasTrustedVolatilityRule(profile, snapshot, "title")
    ? "<volatile:title>"
    : normalizeText(snapshot.title);

  return JSON.stringify({
    origin: snapshot.origin.toLowerCase(),
    path: snapshot.path || "/",
    query: normalizeQuery(snapshot, profile),
    title,
    headings: normalizeList(snapshot.headings),
    landmarks: normalizeList(snapshot.landmarks),
    dialogs: normalizeList(snapshot.dialogs),
    controls,
  });
}

export function fingerprintStateV4(
  snapshot: SemanticStateSnapshot,
  profile: VolatilityProfile = EMPTY_PROFILE,
): StateFingerprint {
  const canonical = canonicalizeStateV4(snapshot, profile);

  return {
    algorithm: "statescout-semantic",
    version: 4,
    canonical,
    hash: createHash("sha256").update(canonical).digest("hex"),
  };
}

export function createFingerprintStateV4(
  profile: VolatilityProfile,
): StateFingerprinter {
  return (snapshot) => fingerprintStateV4(snapshot, profile);
}
