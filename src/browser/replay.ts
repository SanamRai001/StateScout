import type { Page } from "playwright";

import { fingerprintState } from "../core/fingerprint.ts";
import type { StatePath } from "../core/model.ts";
import { executeInteraction, observePage } from "./playwrightAdapter.ts";

export interface ReplayResult {
  ok: boolean;
  verifiedSteps: number;
  expectedStateId: string;
  actualStateHash: string;
  error?: string;
}

export async function verifyReplayPath(
  page: Page,
  startUrl: string,
  path: StatePath,
): Promise<ReplayResult> {
  try {
    await page.goto(startUrl);
    let actualStateHash = fingerprintState(await observePage(page)).hash;

    for (const step of path.steps) {
      await executeInteraction(page, step.interaction);
      actualStateHash = fingerprintState(await observePage(page)).hash;
      if (actualStateHash !== step.expectedStateHash) {
        return {
          ok: false,
          verifiedSteps: path.steps.indexOf(step),
          expectedStateId: path.stateId,
          actualStateHash,
          error: `fingerprint mismatch: expected ${step.expectedStateHash}`,
        };
      }
    }

    return {
      ok: true,
      verifiedSteps: path.steps.length,
      expectedStateId: path.stateId,
      actualStateHash,
    };
  } catch (error) {
    return {
      ok: false,
      verifiedSteps: 0,
      expectedStateId: path.stateId,
      actualStateHash: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
