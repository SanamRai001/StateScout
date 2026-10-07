import type { Page } from "playwright";
import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import type { FrozenVolatilityProfileArtifact } from "../../src/core/offlineVolatilityPromotion.ts";
import { DEFAULT_RULE_REVALIDATION_POLICY } from "../../src/core/offlineVolatilityRevalidation.ts";
import { createVolatilityProfile, volatilityAnchorHash, type ScopedVolatilityRule } from "../../src/core/volatility.ts";
import { createRuleRevalidationEvidenceStore, type RuleRevalidationEvidenceRecord } from "../../src/core/volatilityRevalidationEvidenceStore.ts";
import type { RuleEvidenceWindow, TrustLifecyclePolicy } from "../../src/core/volatilityTrustLifecycle.ts";
import { volatilityFieldValue } from "../../src/core/volatilityCandidates.ts";
import { TRUST_LIFECYCLE_GROUND_TRUTH } from "./groundTruth.ts";

const DAY = 24 * 60 * 60 * 1000;
export const TRUST_LIFECYCLE_POLICY: TrustLifecyclePolicy = {
  maxTrustAgeMs: 3 * DAY,
  maxEvidenceAgeMs: DAY,
  conflictWindowsToRevoke: 2,
  stableWindowsToRestore: 2,
  revalidation: DEFAULT_RULE_REVALIDATION_POLICY,
};

export function lifecycleTimestamp(day: number, hour = 12): string {
  return new Date(Date.UTC(2026, 0, day, hour, 0, 0)).toISOString();
}

export async function createLifecycleParentProfile(page: Page, startUrl: string): Promise<FrozenVolatilityProfileArtifact> {
  await page.goto(`${startUrl}#baseline-1`);
  await page.reload();
  const snapshot = await observePage(page);
  const rule: ScopedVolatilityRule = {
    field: "title",
    anchorHash: volatilityAnchorHash(snapshot, "title"),
    sampleCount: 8,
    distinctValues: ["Dashboard — refresh 1", "Dashboard — refresh 2", "Dashboard — refresh 3", "Dashboard — refresh 4"],
    provenance: "verified-candidate-promotion",
  };
  return {
    schemaVersion: 1,
    kind: "statescout-volatility-profile",
    source: "offline-between-run-promotion",
    observationEvidenceSha256: "0".repeat(64),
    behaviorEvidenceSha256: "1".repeat(64),
    profile: createVolatilityProfile([rule]),
    decisions: [],
  };
}

export async function collectLifecycleWindow(
  page: Page,
  startUrl: string,
  mode: "stable" | "evolved",
  seeds: readonly number[],
  windowId: string,
  observedAt: string,
  applicationScope: string = TRUST_LIFECYCLE_GROUND_TRUTH.applicationScope,
): Promise<RuleEvidenceWindow> {
  const records: RuleRevalidationEvidenceRecord[] = [];
  for (const [index, seed] of seeds.entries()) {
    await page.goto(`${startUrl}#${mode}-${seed}`);
    await page.reload();
    const before = await observePage(page);
    await page.getByRole("button", { name: "Inspect dashboard" }).click();
    const after = await observePage(page);
    records.push({
      sessionId: index < 2 ? `${windowId}-a` : `${windowId}-b`,
      field: "title",
      sourceAnchorHash: volatilityAnchorHash(before, "title"),
      fieldValue: volatilityFieldValue(before, "title"),
      behaviorSignature: fingerprintState(after).hash,
    });
  }
  return { windowId, applicationScope, observedAt, evidence: createRuleRevalidationEvidenceStore(records) };
}
