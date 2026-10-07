import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import type {
  Interaction,
  SemanticStateSnapshot,
} from "../../src/core/model.ts";
import {
  createRawObservation,
  createRawStateArchive,
  parseRawStateArchive,
  projectRawStateArchive,
  rawStateArchiveSha256,
  serializeRawStateArchive,
  type RawStateArchive,
  type RawTransitionRecord,
} from "../../src/core/reversibleStateArchive.ts";
import {
  createVolatilityProfile,
  volatilityAnchorHash,
  type ScopedVolatilityRule,
} from "../../src/core/volatility.ts";
import { REVERSIBLE_EQUIVALENCE_GROUND_TRUTH } from "./groundTruth.ts";

function dashboardSnapshot(refresh: number): SemanticStateSnapshot {
  return {
    origin: "https://statescout.local",
    path: "/dashboard",
    query: {},
    title: `Dashboard — refresh ${refresh}`,
    headings: ["Dashboard"],
    landmarks: ["main"],
    dialogs: [],
    controls: [
      { role: "button", name: "Refresh view" },
      { role: "button", name: "Inspect dashboard" },
    ],
  };
}

function detailsSnapshot(
  kind: "standard" | "priority",
): SemanticStateSnapshot {
  const heading =
    kind === "standard"
      ? "Dashboard standard details"
      : "Dashboard priority details";

  return {
    origin: "https://statescout.local",
    path: "/dashboard/details",
    query: {},
    title: heading,
    headings: [heading],
    landmarks: ["main"],
    dialogs: [],
    controls: [{ role: "button", name: "Back" }],
  };
}

function interaction(id: string, name: string): Interaction {
  return {
    id,
    kind: "click",
    risk: "safe",
    target: {
      role: "button",
      name,
    },
    locatorCandidates: [
      {
        strategy: "role",
        value: name,
        score: 1,
      },
    ],
  };
}

export function createReversibleArchiveFixture(): {
  archive: RawStateArchive;
  trustedRule: ScopedVolatilityRule;
} {
  const snapshots = [
    dashboardSnapshot(1),
    dashboardSnapshot(2),
    dashboardSnapshot(3),
    dashboardSnapshot(4),
    detailsSnapshot("standard"),
    detailsSnapshot("priority"),
  ];

  const observations = snapshots.map((snapshot, index) =>
    createRawObservation({
      id: `obs-${index + 1}`,
      sessionId: "phase16-history",
      observedAt: new Date(
        Date.UTC(2026, 0, 1, 12, index, 0),
      ).toISOString(),
      snapshot,
    }),
  );

  const transitions: RawTransitionRecord[] = [
    {
      id: "raw-transition-1",
      fromObservationId: "obs-1",
      toObservationId: "obs-2",
      interaction: interaction("refresh-step-1", "Refresh view"),
      status: "observed",
    },
    {
      id: "raw-transition-2",
      fromObservationId: "obs-2",
      toObservationId: "obs-3",
      interaction: interaction("refresh-step-2", "Refresh view"),
      status: "observed",
    },
    {
      id: "raw-transition-3",
      fromObservationId: "obs-3",
      toObservationId: "obs-4",
      interaction: interaction("refresh-step-3", "Refresh view"),
      status: "observed",
    },
    {
      id: "raw-transition-4",
      fromObservationId: "obs-1",
      toObservationId: "obs-5",
      interaction: interaction(
        "inspect-dashboard",
        "Inspect dashboard",
      ),
      status: "observed",
    },
    {
      id: "raw-transition-5",
      fromObservationId: "obs-3",
      toObservationId: "obs-5",
      interaction: interaction(
        "inspect-dashboard",
        "Inspect dashboard",
      ),
      status: "observed",
    },
    {
      id: "raw-transition-6",
      fromObservationId: "obs-2",
      toObservationId: "obs-6",
      interaction: interaction(
        "inspect-priority",
        "Inspect dashboard",
      ),
      status: "observed",
    },
    {
      id: "raw-transition-7",
      fromObservationId: "obs-5",
      toObservationId: "obs-1",
      interaction: interaction("back-standard", "Back"),
      status: "observed",
    },
  ];

  const trustedRule: ScopedVolatilityRule = {
    field: "title",
    anchorHash: volatilityAnchorHash(snapshots[0]!, "title"),
    sampleCount: 4,
    distinctValues: [
      "Dashboard — refresh 1",
      "Dashboard — refresh 2",
      "Dashboard — refresh 3",
      "Dashboard — refresh 4",
    ],
    provenance: "verified-candidate-promotion",
  };

  return {
    archive: createRawStateArchive(observations, transitions),
    trustedRule,
  };
}

export function evaluateReversibleEquivalence() {
  const { archive, trustedRule } =
    createReversibleArchiveFixture();

  const trustedProfile = createVolatilityProfile([trustedRule]);
  const revokedProfile = createVolatilityProfile([]);

  const beforeDigest = rawStateArchiveSha256(archive);

  const trustedProjection = projectRawStateArchive(
    archive,
    createFingerprintStateV4(trustedProfile),
  );
  const afterTrustedDigest = rawStateArchiveSha256(archive);

  const revokedProjection = projectRawStateArchive(
    archive,
    createFingerprintStateV4(revokedProfile),
  );
  const afterRevokedDigest = rawStateArchiveSha256(archive);

  const restoredProjection = projectRawStateArchive(
    archive,
    createFingerprintStateV4(trustedProfile),
  );
  const afterRestoredDigest = rawStateArchiveSha256(archive);

  const serialized = serializeRawStateArchive(archive);
  const parsed = parseRawStateArchive(serialized);

  const mergedTransition = trustedProjection.transitions.find(
    (transition) =>
      transition.rawTransitionIds.length > 1,
  );

  const dashboardAlias = trustedProjection.states.find(
    (state) =>
      state.memberObservationIds.includes("obs-1"),
  );

  const revokedDashboardStates = revokedProjection.states.filter(
    (state) =>
      state.memberObservationIds.some((id) =>
        ["obs-1", "obs-2", "obs-3", "obs-4"].includes(id),
      ),
  );

  return {
    raw: {
      observations: archive.observations.length,
      transitions: archive.transitions.length,
      digest: beforeDigest,
      roundTripStable:
        serializeRawStateArchive(parsed) === serialized,
    },
    trustedProjection: {
      states: trustedProjection.states.length,
      transitions: trustedProjection.transitions.length,
      dashboardMembers:
        dashboardAlias?.memberObservationIds.length ?? 0,
      mergedTransitionRawIds:
        mergedTransition?.rawTransitionIds ?? [],
    },
    revokedProjection: {
      states: revokedProjection.states.length,
      transitions: revokedProjection.transitions.length,
      dashboardStates: revokedDashboardStates.length,
    },
    restoredProjection: {
      states: restoredProjection.states.length,
      transitions: restoredProjection.transitions.length,
    },
    rawArchiveDigestStable:
      beforeDigest === afterTrustedDigest &&
      beforeDigest === afterRevokedDigest &&
      beforeDigest === afterRestoredDigest,
    groundTruth: REVERSIBLE_EQUIVALENCE_GROUND_TRUTH,
  };
}
