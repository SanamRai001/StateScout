import type { Page } from "playwright";

import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { createFingerprintStateV4 } from "../../src/core/fingerprintV4.ts";
import { createVolatilityProfile } from "../../src/core/volatility.ts";
import {
  VolatilityEvidenceCollector,
  discoverQuarantinedCandidates,
  mergeVolatilityEvidenceStores,
  parseVolatilityEvidenceStore,
  serializeVolatilityEvidenceStore,
  type VolatilityEvidenceStore,
} from "../../src/core/volatilityEvidenceStore.ts";
import { EXPLORER_EVIDENCE_GROUND_TRUTH } from "./groundTruth.ts";

function graphSignature(result: Awaited<ReturnType<typeof exploreWithPlaywright>>) {
  return {
    stateHashes: result.graph
      .listStates()
      .map((state) => state.fingerprint.hash)
      .sort(),
    transitions: result.graph
      .listTransitions()
      .map((transition) =>
        [
          transition.fromStateId,
          transition.toStateId ?? null,
          transition.interaction.id,
          transition.status,
        ].join("|"),
      )
      .sort(),
    attemptedTransitions: result.attemptedTransitions,
  };
}

async function run(
  page: Page,
  startUrl: string,
  collector?: VolatilityEvidenceCollector,
) {
  const fingerprinter = createFingerprintStateV4(createVolatilityProfile([]));
  const result = await exploreWithPlaywright(page, {
    startUrl,
    maxTransitions: EXPLORER_EVIDENCE_GROUND_TRUTH.maxTransitions,
    fingerprinter,
    ...(collector
      ? {
          observationSink: ({ snapshot }) => {
            collector.observe(snapshot);
          },
        }
      : {}),
  });

  return {
    result,
    signature: graphSignature(result),
  };
}

function storeSummary(store: VolatilityEvidenceStore) {
  return {
    records: store.records.length,
    sessions: [...new Set(store.records.map((record) => record.sessionId))].sort(),
  };
}

export async function evaluateExplorerEvidenceStore(
  page: Page,
  startUrl: string,
) {
  const baseline = await run(page, startUrl);

  const collectorA = new VolatilityEvidenceCollector("phase11-session-a");
  const sessionA = await run(page, startUrl, collectorA);

  const collectorB = new VolatilityEvidenceCollector("phase11-session-b");
  const sessionB = await run(page, startUrl, collectorB);

  const storeA = collectorA.toStore();
  const storeB = collectorB.toStore();
  const merged = mergeVolatilityEvidenceStores(storeA, storeB);
  const serialized = serializeVolatilityEvidenceStore(merged);
  const roundTripped = parseVolatilityEvidenceStore(serialized);
  const idempotentMerge = mergeVolatilityEvidenceStores(merged, storeA);

  const candidates = discoverQuarantinedCandidates(merged);

  return {
    identityInvariant: {
      baselineEqualsSessionA:
        JSON.stringify(baseline.signature) === JSON.stringify(sessionA.signature),
      baselineEqualsSessionB:
        JSON.stringify(baseline.signature) === JSON.stringify(sessionB.signature),
    },
    graph: {
      states: baseline.result.graph.stateCount,
      transitions: baseline.result.graph.transitionCount,
      attemptedTransitions: baseline.result.attemptedTransitions,
    },
    evidenceErrors: {
      baseline: baseline.result.evidenceErrors.length,
      sessionA: sessionA.result.evidenceErrors.length,
      sessionB: sessionB.result.evidenceErrors.length,
    },
    stores: {
      sessionA: storeSummary(storeA),
      sessionB: storeSummary(storeB),
      merged: storeSummary(merged),
      roundTripStable:
        serializeVolatilityEvidenceStore(roundTripped) === serialized,
      idempotentMergeStable:
        serializeVolatilityEvidenceStore(idempotentMerge) === serialized,
    },
    candidates,
  };
}
