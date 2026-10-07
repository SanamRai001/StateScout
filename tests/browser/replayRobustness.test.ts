import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { exploreWithPlaywright } from "../../src/browser/explorer.ts";
import { verifyReplayPath } from "../../src/browser/replay.ts";

const benchmarkUrl = pathToFileURL(resolve("benchmarks/basic-state-graph/index.html")).href;

test("every discovered replay path restores its semantic state", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();

  const exploration = await exploreWithPlaywright(page, { startUrl: benchmarkUrl });
  const paths = new Map<string, Parameters<typeof verifyReplayPath>[2]>();

  // Reconstruct shortest paths from observed transitions, rooted at the empty path.
  paths.set(exploration.rootPath.stateId, exploration.rootPath);
  let changed = true;
  while (changed) {
    changed = false;
    for (const transition of exploration.graph.listTransitions()) {
      if (transition.status !== "observed" || !transition.toStateId || paths.has(transition.toStateId)) continue;
      const parent = paths.get(transition.fromStateId);
      const destination = exploration.graph.getState(transition.toStateId);
      if (!parent || !destination) continue;
      paths.set(transition.toStateId, {
        stateId: transition.toStateId,
        steps: [...parent.steps, { interaction: transition.interaction, expectedStateHash: destination.fingerprint.hash }],
      });
      changed = true;
    }
  }

  assert.equal(paths.size, exploration.graph.stateCount);
  for (const path of paths.values()) {
    const replay = await verifyReplayPath(page, benchmarkUrl, path);
    assert.equal(replay.ok, true, replay.error);
    const expected = exploration.graph.getState(path.stateId);
    assert.equal(replay.actualStateHash, expected?.fingerprint.hash);
  }
});
