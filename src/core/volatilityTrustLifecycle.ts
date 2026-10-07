import { createHash } from "node:crypto";

import {
  assessTrustedVolatilityRule,
  DEFAULT_RULE_REVALIDATION_POLICY,
  type RuleRevalidationPolicy,
} from "./offlineVolatilityRevalidation.ts";
import {
  createVolatilityProfile,
  type ScopedVolatilityRule,
  type VolatilityProfile,
} from "./volatility.ts";
import {
  serializeFrozenVolatilityProfile,
  type FrozenVolatilityProfileArtifact,
} from "./offlineVolatilityPromotion.ts";
import {
  serializeRuleRevalidationEvidenceStore,
  type RuleRevalidationEvidenceStore,
} from "./volatilityRevalidationEvidenceStore.ts";

export type RuleTrustState =
  | "trusted"
  | "challenged"
  | "revoked"
  | "cooldown";

export interface RuleTrustEntry {
  rule: ScopedVolatilityRule;
  state: RuleTrustState;
  applicationScope: string;
  lastVerifiedAt: string;
  consecutiveConflictWindows: number;
  consecutiveStableWindows: number;
}

export interface TrustLifecyclePolicy {
  maxTrustAgeMs: number;
  maxEvidenceAgeMs: number;
  conflictWindowsToRevoke: number;
  stableWindowsToRestore: number;
  revalidation: RuleRevalidationPolicy;
}

export const DEFAULT_TRUST_LIFECYCLE_POLICY: TrustLifecyclePolicy = {
  maxTrustAgeMs: 30 * 24 * 60 * 60 * 1000,
  maxEvidenceAgeMs: 7 * 24 * 60 * 60 * 1000,
  conflictWindowsToRevoke: 2,
  stableWindowsToRestore: 2,
  revalidation: DEFAULT_RULE_REVALIDATION_POLICY,
};

export interface RuleEvidenceWindow {
  windowId: string;
  applicationScope: string;
  observedAt: string;
  evidence: RuleRevalidationEvidenceStore;
}

export type LifecycleDecisionStatus =
  | "retained"
  | "challenged"
  | "challenge-cleared"
  | "revoked"
  | "cooldown"
  | "restored"
  | "insufficient-evidence"
  | "scope-mismatch"
  | "stale-evidence"
  | "duplicate-window";

export interface LifecycleDecision {
  rule: ScopedVolatilityRule;
  previousState: RuleTrustState;
  nextState: RuleTrustState;
  status: LifecycleDecisionStatus;
  reasons: readonly string[];
  windowId: string;
}

export interface FrozenTrustLifecycleArtifact {
  schemaVersion: 1;
  kind: "statescout-volatility-trust-lifecycle";
  source: "offline-between-run-lifecycle";
  applicationScope: string;
  parentArtifactSha256: string;
  evidenceWindowSha256?: string;
  generatedAt: string;
  policy: TrustLifecyclePolicy;
  entries: readonly RuleTrustEntry[];
  processedWindowIds: readonly string[];
  decisions: readonly LifecycleDecision[];
}

export interface ActiveProfileMaterialization {
  profile: VolatilityProfile;
  inactive: readonly {
    rule: ScopedVolatilityRule;
    reason:
      | "not-trusted"
      | "scope-mismatch"
      | "stale-trust";
  }[];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label} timestamp: ${value}`);
  }
  return parsed;
}

function ageMs(referenceTime: string, observedAt: string): number {
  const reference = parseTimestamp(referenceTime, "reference");
  const observed = parseTimestamp(observedAt, "observed");
  const age = reference - observed;
  if (age < 0) {
    throw new Error("Evidence timestamp cannot be in the future.");
  }
  return age;
}

function sortEntries(entries: readonly RuleTrustEntry[]): RuleTrustEntry[] {
  return [...entries].sort((a, b) =>
    `${a.rule.field}:${a.rule.anchorHash}`.localeCompare(
      `${b.rule.field}:${b.rule.anchorHash}`,
    ),
  );
}

export function initializeTrustLifecycle(
  parentProfile: FrozenVolatilityProfileArtifact,
  applicationScope: string,
  generatedAt: string,
  policy: TrustLifecyclePolicy = DEFAULT_TRUST_LIFECYCLE_POLICY,
): FrozenTrustLifecycleArtifact {
  if (applicationScope.trim().length === 0) {
    throw new Error("applicationScope must not be empty.");
  }
  parseTimestamp(generatedAt, "generatedAt");

  return {
    schemaVersion: 1,
    kind: "statescout-volatility-trust-lifecycle",
    source: "offline-between-run-lifecycle",
    applicationScope,
    parentArtifactSha256: sha256(
      serializeFrozenVolatilityProfile(parentProfile),
    ),
    generatedAt,
    policy,
    entries: sortEntries(
      parentProfile.profile.rules.map((rule) => ({
        rule,
        state: "trusted" as const,
        applicationScope,
        lastVerifiedAt: generatedAt,
        consecutiveConflictWindows: 0,
        consecutiveStableWindows: 0,
      })),
    ),
    processedWindowIds: [],
    decisions: [],
  };
}

function unchangedDecision(
  entry: RuleTrustEntry,
  windowId: string,
  status: LifecycleDecisionStatus,
  reason: string,
): LifecycleDecision {
  return {
    rule: entry.rule,
    previousState: entry.state,
    nextState: entry.state,
    status,
    reasons: [reason],
    windowId,
  };
}

function transitionStable(
  entry: RuleTrustEntry,
  window: RuleEvidenceWindow,
  policy: TrustLifecyclePolicy,
): { entry: RuleTrustEntry; decision: LifecycleDecision } {
  if (entry.state === "trusted") {
    const next: RuleTrustEntry = {
      ...entry,
      lastVerifiedAt: window.observedAt,
      consecutiveConflictWindows: 0,
      consecutiveStableWindows: 0,
    };
    return {
      entry: next,
      decision: {
        rule: entry.rule,
        previousState: entry.state,
        nextState: next.state,
        status: "retained",
        reasons: [],
        windowId: window.windowId,
      },
    };
  }

  if (entry.state === "challenged") {
    const next: RuleTrustEntry = {
      ...entry,
      state: "trusted",
      lastVerifiedAt: window.observedAt,
      consecutiveConflictWindows: 0,
      consecutiveStableWindows: 0,
    };
    return {
      entry: next,
      decision: {
        rule: entry.rule,
        previousState: entry.state,
        nextState: next.state,
        status: "challenge-cleared",
        reasons: [],
        windowId: window.windowId,
      },
    };
  }

  const stableWindows = entry.consecutiveStableWindows + 1;
  if (stableWindows >= policy.stableWindowsToRestore) {
    const next: RuleTrustEntry = {
      ...entry,
      state: "trusted",
      lastVerifiedAt: window.observedAt,
      consecutiveConflictWindows: 0,
      consecutiveStableWindows: 0,
    };
    return {
      entry: next,
      decision: {
        rule: entry.rule,
        previousState: entry.state,
        nextState: next.state,
        status: "restored",
        reasons: [],
        windowId: window.windowId,
      },
    };
  }

  const next: RuleTrustEntry = {
    ...entry,
    state: "cooldown",
    consecutiveConflictWindows: 0,
    consecutiveStableWindows: stableWindows,
  };
  return {
    entry: next,
    decision: {
      rule: entry.rule,
      previousState: entry.state,
      nextState: next.state,
      status: "cooldown",
      reasons: [
        `needs ${policy.stableWindowsToRestore - stableWindows} more stable window(s) before restoration`,
      ],
      windowId: window.windowId,
    },
  };
}

function transitionConflict(
  entry: RuleTrustEntry,
  window: RuleEvidenceWindow,
  policy: TrustLifecyclePolicy,
): { entry: RuleTrustEntry; decision: LifecycleDecision } {
  if (entry.state === "revoked" || entry.state === "cooldown") {
    const next: RuleTrustEntry = {
      ...entry,
      state: "revoked",
      consecutiveStableWindows: 0,
      consecutiveConflictWindows: Math.max(
        entry.consecutiveConflictWindows,
        policy.conflictWindowsToRevoke,
      ),
    };
    return {
      entry: next,
      decision: {
        rule: entry.rule,
        previousState: entry.state,
        nextState: next.state,
        status: "revoked",
        reasons: ["later safe probes continue to diverge"],
        windowId: window.windowId,
      },
    };
  }

  const conflictWindows = entry.consecutiveConflictWindows + 1;
  if (conflictWindows >= policy.conflictWindowsToRevoke) {
    const next: RuleTrustEntry = {
      ...entry,
      state: "revoked",
      consecutiveConflictWindows: conflictWindows,
      consecutiveStableWindows: 0,
    };
    return {
      entry: next,
      decision: {
        rule: entry.rule,
        previousState: entry.state,
        nextState: next.state,
        status: "revoked",
        reasons: ["contradictory behavior persisted across challenge windows"],
        windowId: window.windowId,
      },
    };
  }

  const next: RuleTrustEntry = {
    ...entry,
    state: "challenged",
    consecutiveConflictWindows: conflictWindows,
    consecutiveStableWindows: 0,
  };
  return {
    entry: next,
    decision: {
      rule: entry.rule,
      previousState: entry.state,
      nextState: next.state,
      status: "challenged",
      reasons: [
        `needs ${policy.conflictWindowsToRevoke - conflictWindows} more contradictory window(s) before revocation`,
      ],
      windowId: window.windowId,
    },
  };
}

export function advanceTrustLifecycle(
  parent: FrozenTrustLifecycleArtifact,
  window: RuleEvidenceWindow,
  referenceTime: string,
): FrozenTrustLifecycleArtifact {
  if (window.windowId.trim().length === 0) {
    throw new Error("windowId must not be empty.");
  }

  parseTimestamp(referenceTime, "reference");
  parseTimestamp(window.observedAt, "observed");

  const parentDigest = sha256(serializeTrustLifecycleArtifact(parent));

  if (parent.processedWindowIds.includes(window.windowId)) {
    return {
      ...parent,
      parentArtifactSha256: parentDigest,
      generatedAt: referenceTime,
      decisions: parent.entries.map((entry) =>
        unchangedDecision(
          entry,
          window.windowId,
          "duplicate-window",
          "evidence window was already processed",
        ),
      ),
    };
  }

  const windowDigest = sha256(
    JSON.stringify(
      {
        windowId: window.windowId,
        applicationScope: window.applicationScope,
        observedAt: window.observedAt,
        evidence: serializeRuleRevalidationEvidenceStore(window.evidence),
      },
      null,
      2,
    ) + "\n",
  );

  if (window.applicationScope !== parent.applicationScope) {
    return {
      ...parent,
      parentArtifactSha256: parentDigest,
      generatedAt: referenceTime,
      evidenceWindowSha256: windowDigest,
      processedWindowIds: [...parent.processedWindowIds, window.windowId].sort(),
      decisions: parent.entries.map((entry) =>
        unchangedDecision(
          entry,
          window.windowId,
          "scope-mismatch",
          "evidence window belongs to a different application scope",
        ),
      ),
    };
  }

  if (ageMs(referenceTime, window.observedAt) > parent.policy.maxEvidenceAgeMs) {
    return {
      ...parent,
      parentArtifactSha256: parentDigest,
      generatedAt: referenceTime,
      evidenceWindowSha256: windowDigest,
      processedWindowIds: [...parent.processedWindowIds, window.windowId].sort(),
      decisions: parent.entries.map((entry) =>
        unchangedDecision(
          entry,
          window.windowId,
          "stale-evidence",
          "evidence window is older than the configured freshness limit",
        ),
      ),
    };
  }

  const nextEntries: RuleTrustEntry[] = [];
  const decisions: LifecycleDecision[] = [];

  for (const entry of parent.entries) {
    const assessment = assessTrustedVolatilityRule(
      entry.rule,
      window.evidence,
      parent.policy.revalidation,
    );

    if (assessment.status === "insufficient-evidence") {
      nextEntries.push(entry);
      decisions.push({
        rule: entry.rule,
        previousState: entry.state,
        nextState: entry.state,
        status: "insufficient-evidence",
        reasons: assessment.reasons,
        windowId: window.windowId,
      });
      continue;
    }

    const transition =
      assessment.status === "revoked"
        ? transitionConflict(entry, window, parent.policy)
        : transitionStable(entry, window, parent.policy);

    nextEntries.push(transition.entry);
    decisions.push(transition.decision);
  }

  return {
    schemaVersion: 1,
    kind: "statescout-volatility-trust-lifecycle",
    source: "offline-between-run-lifecycle",
    applicationScope: parent.applicationScope,
    parentArtifactSha256: parentDigest,
    evidenceWindowSha256: windowDigest,
    generatedAt: referenceTime,
    policy: parent.policy,
    entries: sortEntries(nextEntries),
    processedWindowIds: [...parent.processedWindowIds, window.windowId].sort(),
    decisions,
  };
}

export function materializeActiveProfile(
  artifact: FrozenTrustLifecycleArtifact,
  requestedScope: string,
  referenceTime: string,
): ActiveProfileMaterialization {
  parseTimestamp(referenceTime, "reference");

  const activeRules: ScopedVolatilityRule[] = [];
  const inactive: ActiveProfileMaterialization["inactive"][number][] = [];

  for (const entry of artifact.entries) {
    if (
      requestedScope !== artifact.applicationScope ||
      entry.applicationScope !== requestedScope
    ) {
      inactive.push({ rule: entry.rule, reason: "scope-mismatch" });
      continue;
    }

    if (entry.state !== "trusted") {
      inactive.push({ rule: entry.rule, reason: "not-trusted" });
      continue;
    }

    if (
      ageMs(referenceTime, entry.lastVerifiedAt) >
      artifact.policy.maxTrustAgeMs
    ) {
      inactive.push({ rule: entry.rule, reason: "stale-trust" });
      continue;
    }

    activeRules.push(entry.rule);
  }

  return {
    profile: createVolatilityProfile(activeRules),
    inactive,
  };
}

export function serializeTrustLifecycleArtifact(
  artifact: FrozenTrustLifecycleArtifact,
): string {
  return JSON.stringify(artifact, null, 2) + "\n";
}

export function parseTrustLifecycleArtifact(
  serialized: string,
): FrozenTrustLifecycleArtifact {
  const parsed = JSON.parse(serialized) as Partial<FrozenTrustLifecycleArtifact>;

  if (
    parsed.schemaVersion !== 1 ||
    parsed.kind !== "statescout-volatility-trust-lifecycle" ||
    parsed.source !== "offline-between-run-lifecycle" ||
    typeof parsed.applicationScope !== "string" ||
    typeof parsed.parentArtifactSha256 !== "string" ||
    typeof parsed.generatedAt !== "string" ||
    typeof parsed.policy !== "object" ||
    parsed.policy === null ||
    !Array.isArray(parsed.entries) ||
    !Array.isArray(parsed.processedWindowIds) ||
    !Array.isArray(parsed.decisions)
  ) {
    throw new Error("Unsupported or invalid trust lifecycle artifact.");
  }

  return parsed as FrozenTrustLifecycleArtifact;
}
