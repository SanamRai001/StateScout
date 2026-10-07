import type {
  FrozenTrustLifecycleArtifact,
  RuleTrustEntry,
  RuleTrustState,
} from "./volatilityTrustLifecycle.ts";
import type { VolatilityField } from "./volatility.ts";

export interface RuleRevalidationImpact {
  field: VolatilityField;
  anchorHash: string;
  estimatedAffectedStates: number;
}

export interface RevalidationPriorityBreakdown {
  stateUrgency: number;
  freshnessRisk: number;
  conflictHistory: number;
  coverageImpact: number;
}

export interface RevalidationPriority {
  field: VolatilityField;
  anchorHash: string;
  state: RuleTrustState;
  estimatedAffectedStates: number;
  score: number;
  breakdown: RevalidationPriorityBreakdown;
}

export interface SelectiveRevalidationPlan {
  referenceTime: string;
  budget: number;
  ranking: readonly RevalidationPriority[];
  selected: readonly RevalidationPriority[];
  skipped: readonly RevalidationPriority[];
}

const STATE_URGENCY: Readonly<Record<RuleTrustState, number>> = {
  trusted: 0,
  challenged: 100,
  revoked: 30,
  cooldown: 40,
};

function ruleKey(field: VolatilityField, anchorHash: string): string {
  return `${field}\u0000${anchorHash}`;
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label} timestamp: ${value}`);
  }
  return parsed;
}

function ageMs(referenceTime: string, verifiedAt: string): number {
  const reference = parseTimestamp(referenceTime, "reference");
  const verified = parseTimestamp(verifiedAt, "verification");
  const age = reference - verified;

  if (age < 0) {
    throw new Error("Rule verification timestamp cannot be in the future.");
  }

  return age;
}

function coverageScore(estimatedAffectedStates: number): number {
  if (
    !Number.isInteger(estimatedAffectedStates) ||
    estimatedAffectedStates < 0
  ) {
    throw new Error(
      "estimatedAffectedStates must be a non-negative integer.",
    );
  }

  return Math.min(estimatedAffectedStates, 10) * 5;
}

function freshnessScore(
  entry: RuleTrustEntry,
  referenceTime: string,
  maxTrustAgeMs: number,
): number {
  if (entry.state !== "trusted") return 0;
  if (maxTrustAgeMs <= 0) {
    throw new Error("maxTrustAgeMs must be greater than zero.");
  }

  const ratio = Math.min(
    ageMs(referenceTime, entry.lastVerifiedAt) / maxTrustAgeMs,
    1,
  );

  return Math.round(ratio * 60);
}

function conflictScore(entry: RuleTrustEntry): number {
  return Math.min(entry.consecutiveConflictWindows, 2) * 10;
}

export function rankRuleForRevalidation(
  entry: RuleTrustEntry,
  impact: RuleRevalidationImpact,
  referenceTime: string,
  maxTrustAgeMs: number,
): RevalidationPriority {
  if (
    entry.rule.field !== impact.field ||
    entry.rule.anchorHash !== impact.anchorHash
  ) {
    throw new Error("Revalidation impact does not match lifecycle rule.");
  }

  const breakdown: RevalidationPriorityBreakdown = {
    stateUrgency: STATE_URGENCY[entry.state],
    freshnessRisk: freshnessScore(
      entry,
      referenceTime,
      maxTrustAgeMs,
    ),
    conflictHistory: conflictScore(entry),
    coverageImpact: coverageScore(impact.estimatedAffectedStates),
  };

  return {
    field: entry.rule.field,
    anchorHash: entry.rule.anchorHash,
    state: entry.state,
    estimatedAffectedStates: impact.estimatedAffectedStates,
    score:
      breakdown.stateUrgency +
      breakdown.freshnessRisk +
      breakdown.conflictHistory +
      breakdown.coverageImpact,
    breakdown,
  };
}

export function scheduleSelectiveRevalidation(
  artifact: FrozenTrustLifecycleArtifact,
  impacts: readonly RuleRevalidationImpact[],
  referenceTime: string,
  budget: number,
): SelectiveRevalidationPlan {
  if (!Number.isInteger(budget) || budget < 0) {
    throw new Error("Revalidation budget must be a non-negative integer.");
  }

  parseTimestamp(referenceTime, "reference");

  const impactByRule = new Map(
    impacts.map((impact) => [
      ruleKey(impact.field, impact.anchorHash),
      impact,
    ]),
  );

  const ranking = artifact.entries
    .map((entry) => {
      const impact = impactByRule.get(
        ruleKey(entry.rule.field, entry.rule.anchorHash),
      );

      if (!impact) {
        throw new Error(
          `Missing revalidation impact for ${entry.rule.field}:${entry.rule.anchorHash}`,
        );
      }

      return rankRuleForRevalidation(
        entry,
        impact,
        referenceTime,
        artifact.policy.maxTrustAgeMs,
      );
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        ruleKey(a.field, a.anchorHash).localeCompare(
          ruleKey(b.field, b.anchorHash),
        ),
    );

  return {
    referenceTime,
    budget,
    ranking,
    selected: ranking.slice(0, budget),
    skipped: ranking.slice(budget),
  };
}
