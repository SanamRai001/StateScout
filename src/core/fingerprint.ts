import { createHash } from "node:crypto";

import type {
  SemanticControl,
  SemanticStateSnapshot,
  StateFingerprint,
} from "./model.js";

function normalizeText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeList(values: readonly string[]): string[] {
  return values
    .map((value) => normalizeText(value))
    .filter((value): value is string => value !== undefined)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeQuery(
  query: Readonly<Record<string, string | readonly string[]>>,
): Record<string, string | string[]> {
  return Object.fromEntries(
    Object.entries(query)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? [...value].sort() : value,
      ]),
  );
}

function controlKey(control: SemanticControl): string {
  return JSON.stringify([
    control.role,
    normalizeText(control.name),
    normalizeText(control.label),
    normalizeText(control.value),
    control.selected ?? null,
    control.expanded ?? null,
    control.checked ?? null,
    control.disabled ?? null,
    normalizeText(control.context),
  ]);
}

function normalizeControls(
  controls: readonly SemanticControl[],
): SemanticControl[] {
  return controls
    .map((control) => ({
      role: control.role.trim().toLowerCase(),
      ...(normalizeText(control.name) !== undefined
        ? { name: normalizeText(control.name) }
        : {}),
      ...(normalizeText(control.label) !== undefined
        ? { label: normalizeText(control.label) }
        : {}),
      ...(normalizeText(control.value) !== undefined
        ? { value: normalizeText(control.value) }
        : {}),
      ...(control.selected !== undefined ? { selected: control.selected } : {}),
      ...(control.expanded !== undefined ? { expanded: control.expanded } : {}),
      ...(control.checked !== undefined ? { checked: control.checked } : {}),
      ...(control.disabled !== undefined ? { disabled: control.disabled } : {}),
      ...(normalizeText(control.context) !== undefined
        ? { context: normalizeText(control.context) }
        : {}),
    }))
    .sort((left, right) => controlKey(left).localeCompare(controlKey(right)));
}

export function canonicalizeState(snapshot: SemanticStateSnapshot): string {
  const canonical = {
    origin: snapshot.origin.toLowerCase(),
    path: snapshot.path || "/",
    query: normalizeQuery(snapshot.query),
    title: normalizeText(snapshot.title),
    headings: normalizeList(snapshot.headings),
    landmarks: normalizeList(snapshot.landmarks),
    dialogs: normalizeList(snapshot.dialogs),
    controls: normalizeControls(snapshot.controls),
  };

  return JSON.stringify(canonical);
}

export function fingerprintState(
  snapshot: SemanticStateSnapshot,
): StateFingerprint {
  const canonical = canonicalizeState(snapshot);
  const hash = createHash("sha256").update(canonical).digest("hex");

  return {
    algorithm: "statescout-semantic",
    version: 1,
    canonical,
    hash,
  };
}
