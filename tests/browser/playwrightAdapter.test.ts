import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { fingerprintState } from "../../src/core/fingerprint.ts";
import { discoverInteractions, executeInteraction, observePage } from "../../src/browser/playwrightAdapter.ts";

const benchmarkUrl = pathToFileURL(resolve("benchmarks/basic-state-graph/index.html")).href;

test("Playwright adapter observes semantic state and a same-URL transition", async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.goto(benchmarkUrl);

  const home = await observePage(page);
  assert.deepEqual(home.headings, ["Home"]);
  assert.equal(home.controls.length, 3);

  const interactions = await discoverInteractions(page);
  const dialog = interactions.find((interaction) => interaction.target.name === "Open dialog");
  assert.ok(dialog);
  assert.equal(dialog.risk, "safe");

  const before = fingerprintState(home);
  await executeInteraction(page, dialog);
  const afterState = await observePage(page);
  const after = fingerprintState(afterState);

  assert.notEqual(after.hash, before.hash);
  assert.deepEqual(afterState.dialogs, ["Example dialog"]);
  assert.deepEqual(
    afterState.controls.map((control) => control.name),
    ["Cancel", "Details"],
  );
  assert.equal(page.url(), benchmarkUrl);
});
