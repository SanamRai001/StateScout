import assert from "node:assert/strict";
import test from "node:test";

import { REVERSIBLE_EQUIVALENCE_GROUND_TRUTH } from "../../benchmarks/reversible-equivalence/groundTruth.ts";
import {
  createReversibleArchiveFixture,
  evaluateReversibleEquivalence,
} from "../../benchmarks/reversible-equivalence/evaluate.ts";
import {
  createRawStateArchive,
  projectRawStateArchive,
  rawStateArchiveSha256,
} from "../../src/core/reversibleStateArchive.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import { createVolatilityProfile } from "../../src/core/volatility.ts";

test("Phase 16 reprojects historical states without mutating raw evidence", () => {
  const result = evaluateReversibleEquivalence();
  const expected = REVERSIBLE_EQUIVALENCE_GROUND_TRUTH;

  assert.equal(result.raw.observations, expected.rawObservations);
  assert.equal(result.raw.transitions, expected.rawTransitions);
  assert.equal(result.raw.roundTripStable, true);
  assert.equal(
    result.rawArchiveDigestStable,
    expected.rawArchiveDigestStableAcrossReprojection,
  );

  assert.deepEqual(result.trustedProjection, {
    states: expected.trustedProjection.states,
    transitions: expected.trustedProjection.transitions,
    dashboardMembers:
      expected.trustedProjection.dashboardMembers,
    mergedTransitionRawIds: [
      "raw-transition-4",
      "raw-transition-5",
    ],
  });

  assert.deepEqual(result.revokedProjection, {
    states: expected.revokedProjection.states,
    transitions: expected.revokedProjection.transitions,
    dashboardStates:
      expected.revokedProjection.dashboardStates,
  });

  assert.deepEqual(result.restoredProjection, {
    states: expected.restoredProjection.states,
    transitions: expected.restoredProjection.transitions,
  });
});

test("projected transition aliases preserve raw transition provenance", () => {
  const { archive, trustedRule } =
    createReversibleArchiveFixture();

  const projected = projectRawStateArchive(
    archive,
    createFingerprintStateV4(
      createVolatilityProfile([trustedRule]),
    ),
  );

  const merged = projected.transitions.filter(
    (transition) => transition.rawTransitionIds.length > 1,
  );

  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0]?.rawTransitionIds, [
    "raw-transition-4",
    "raw-transition-5",
  ]);

  const coveredRawTransitions = new Set(
    projected.transitions.flatMap(
      (transition) => transition.rawTransitionIds,
    ),
  );

  assert.equal(
    coveredRawTransitions.size,
    archive.transitions.length,
  );
});

test("raw archive rejects conflicting ids and projection remains pure", () => {
  const { archive, trustedRule } =
    createReversibleArchiveFixture();
  const before = rawStateArchiveSha256(archive);

  assert.throws(
    () =>
      createRawStateArchive(
        [
          ...archive.observations,
          {
            ...archive.observations[0]!,
            snapshot: {
              ...archive.observations[0]!.snapshot,
              title: "Conflicting historical value",
            },
          },
        ],
        archive.transitions,
      ),
    /Raw observation fingerprint mismatch/,
  );

  assert.throws(
    () =>
      createRawStateArchive(
        [
          ...archive.observations,
          {
            ...archive.observations[1]!,
            id: archive.observations[0]!.id,
          },
        ],
        archive.transitions,
      ),
    /Conflicting raw observation id/,
  );

  projectRawStateArchive(
    archive,
    createFingerprintStateV4(
      createVolatilityProfile([trustedRule]),
    ),
  );

  assert.equal(rawStateArchiveSha256(archive), before);
});
