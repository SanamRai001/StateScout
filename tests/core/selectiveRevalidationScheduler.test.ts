import assert from "node:assert/strict";
import test from "node:test";

import { SELECTIVE_REVALIDATION_GROUND_TRUTH } from "../../benchmarks/selective-revalidation/groundTruth.ts";
import {
  createSelectiveRevalidationFixture,
  evaluateSelectiveRevalidation,
  selectiveRevalidationImpacts,
} from "../../benchmarks/selective-revalidation/evaluate.ts";
import {
  scheduleSelectiveRevalidation,
} from "../../src/core/selectiveRevalidationScheduler.ts";

test("Phase 15 ranks multi-rule revalidation risk under a fixed budget", () => {
  const result = evaluateSelectiveRevalidation();

  assert.deepEqual(
    result.plan.ranking.map(
      ({ anchorHash, state, estimatedAffectedStates, score }) => ({
        anchorHash,
        state,
        estimatedAffectedStates,
        score,
      }),
    ),
    SELECTIVE_REVALIDATION_GROUND_TRUTH.ranking.map(
      ({
        anchorHash,
        expectedState,
        estimatedAffectedStates,
        expectedScore,
      }) => ({
        anchorHash,
        state: expectedState,
        estimatedAffectedStates,
        score: expectedScore,
      }),
    ),
  );

  assert.deepEqual(
    result.plan.selected.map(({ anchorHash }) => anchorHash),
    SELECTIVE_REVALIDATION_GROUND_TRUTH.selectedAnchors,
  );
  assert.equal(result.plan.selected.length, 2);
  assert.equal(result.plan.skipped.length, 2);
  assert.equal(result.selectedFraction, 0.5);
  assert.equal(result.savedRuleProbes, 2);
});

test("selected-rule evidence changes only the matching lifecycle entry", () => {
  const result = evaluateSelectiveRevalidation();
  const expected = SELECTIVE_REVALIDATION_GROUND_TRUTH.isolation;

  assert.equal(
    result.statesBefore["anchor-challenged-critical"],
    expected.challengedBefore,
  );
  assert.equal(
    result.statesAfterSelectedEvidence[
      "anchor-challenged-critical"
    ],
    expected.challengedAfterStableEvidence,
  );
  assert.equal(
    result.statesAfterSelectedEvidence["anchor-trusted-aging"],
    expected.untouchedTrustedAging,
  );
  assert.equal(
    result.statesAfterSelectedEvidence["anchor-cooldown-medium"],
    expected.untouchedCooldown,
  );
  assert.equal(
    result.statesAfterSelectedEvidence[
      "anchor-trusted-fresh-low"
    ],
    expected.untouchedFresh,
  );

  assert.equal(result.selectedDecision?.status, "challenge-cleared");
  assert.ok(
    result.untouchedDecisions.every(
      (decision) => decision.status === "insufficient-evidence",
    ),
  );
});

test("selective scheduler is deterministic and validates complete impact metadata", () => {
  const artifact = createSelectiveRevalidationFixture();
  const impacts = selectiveRevalidationImpacts();

  const first = scheduleSelectiveRevalidation(
    artifact,
    impacts,
    SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
    3,
  );
  const second = scheduleSelectiveRevalidation(
    artifact,
    [...impacts].reverse(),
    SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
    3,
  );

  assert.deepEqual(first.ranking, second.ranking);

  assert.throws(
    () =>
      scheduleSelectiveRevalidation(
        artifact,
        impacts.slice(0, 3),
        SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
        2,
      ),
    /Missing revalidation impact/,
  );

  assert.throws(
    () =>
      scheduleSelectiveRevalidation(
        artifact,
        impacts.map((impact, index) =>
          index === 0
            ? { ...impact, estimatedAffectedStates: -1 }
            : impact,
        ),
        SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
        2,
      ),
    /estimatedAffectedStates must be a non-negative integer/,
  );

  assert.throws(
    () =>
      scheduleSelectiveRevalidation(
        artifact,
        impacts,
        SELECTIVE_REVALIDATION_GROUND_TRUTH.referenceTime,
        -1,
      ),
    /budget must be a non-negative integer/i,
  );
});
