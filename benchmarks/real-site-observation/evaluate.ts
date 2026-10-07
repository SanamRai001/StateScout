import type { Page } from "playwright";

import { observePage } from "../../src/browser/playwrightAdapter.ts";
import { fingerprintState } from "../../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../../src/core/fingerprintV3.ts";
import { REAL_SITE_TARGETS, type RealSiteTarget } from "./targets.ts";

export interface RealSiteSample {
  index: number;
  url: string;
  title?: string;
  headings: readonly string[];
  controls: number;
  dialogs: number;
  hashes: {
    v1: string;
    v2: string;
    v3: string;
  };
}

export interface RealSiteObservation {
  id: string;
  url: string;
  rationale: string;
  status: "observed" | "unavailable";
  samples: readonly RealSiteSample[];
  uniqueHashes: {
    v1: number;
    v2: number;
    v3: number;
  };
  error?: string;
}

async function observeTarget(
  page: Page,
  target: RealSiteTarget,
  sampleCount: number,
): Promise<RealSiteObservation> {
  const samples: RealSiteSample[] = [];

  try {
    for (let index = 0; index < sampleCount; index += 1) {
      await page.goto(target.url, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
      await page.waitForTimeout(300);

      const snapshot = await observePage(page);
      samples.push({
        index,
        url: page.url(),
        ...(snapshot.title ? { title: snapshot.title } : {}),
        headings: snapshot.headings,
        controls: snapshot.controls.length,
        dialogs: snapshot.dialogs.length,
        hashes: {
          v1: fingerprintState(snapshot).hash,
          v2: fingerprintStateV2(snapshot).hash,
          v3: fingerprintStateV3(snapshot).hash,
        },
      });
    }

    return {
      id: target.id,
      url: target.url,
      rationale: target.rationale,
      status: "observed",
      samples,
      uniqueHashes: {
        v1: new Set(samples.map((sample) => sample.hashes.v1)).size,
        v2: new Set(samples.map((sample) => sample.hashes.v2)).size,
        v3: new Set(samples.map((sample) => sample.hashes.v3)).size,
      },
    };
  } catch (error) {
    return {
      id: target.id,
      url: target.url,
      rationale: target.rationale,
      status: "unavailable",
      samples,
      uniqueHashes: {
        v1: new Set(samples.map((sample) => sample.hashes.v1)).size,
        v2: new Set(samples.map((sample) => sample.hashes.v2)).size,
        v3: new Set(samples.map((sample) => sample.hashes.v3)).size,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function observeRealSites(
  page: Page,
  sampleCount = 3,
): Promise<readonly RealSiteObservation[]> {
  const results: RealSiteObservation[] = [];

  for (const target of REAL_SITE_TARGETS) {
    results.push(await observeTarget(page, target, sampleCount));
  }

  return results;
}
