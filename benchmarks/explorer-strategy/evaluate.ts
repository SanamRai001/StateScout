import type { Page } from "playwright";

import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import type { StateFingerprinter } from "../../src/core/graph.ts";
import { EXPLORER_STRATEGY_GROUND_TRUTH } from "./groundTruth.ts";

async function run(page: Page, startUrl: string, fingerprinter: StateFingerprinter) {
  const result = await exploreWithPlaywright(page, { startUrl, fingerprinter, maxTransitions: 20 });
  const headings = result.graph.listStates().map((state) => state.snapshot.headings[0]?.toLowerCase());
  const meaningfulStatesFound = new Set(headings.filter((value): value is string =>
    EXPLORER_STRATEGY_GROUND_TRUTH.meaningfulStates.includes(value as "home" | "details")
  ));

  return {
    graphStates: result.graph.stateCount,
    graphTransitions: result.graph.transitionCount,
    attemptedTransitions: result.attemptedTransitions,
    meaningfulStatesFound: [...meaningfulStatesFound].sort(),
    meaningfulStateCoverage: meaningfulStatesFound.size / EXPLORER_STRATEGY_GROUND_TRUTH.meaningfulStateCount,
    excessStates: result.graph.stateCount - EXPLORER_STRATEGY_GROUND_TRUTH.meaningfulStateCount,
    failedTransitions: result.graph.listTransitions().filter((transition) => transition.status === "failed").length,
  };
}

export async function compareExplorerStrategies(page: Page, startUrl: string) {
  const v1 = await run(page, startUrl, fingerprintState);
  const v2 = await run(page, startUrl, fingerprintStateV2);
  return {
    v1,
    v2,
    delta: {
      graphStates: v2.graphStates - v1.graphStates,
      graphTransitions: v2.graphTransitions - v1.graphTransitions,
      attemptedTransitions: v2.attemptedTransitions - v1.attemptedTransitions,
      excessStates: v2.excessStates - v1.excessStates,
    },
  };
}
