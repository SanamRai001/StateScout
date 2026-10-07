import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import { evaluateAdversarialIdentity } from "../benchmarks/adversarial-identity/evaluate.ts";
import { evaluateBrowserGeneralization } from "../benchmarks/browser-generalization/evaluate.ts";
import { compareExplorerStrategies } from "../benchmarks/explorer-strategy/evaluate.ts";
import { STATE_EQUIVALENCE_CASES } from "../benchmarks/state-equivalence/cases.ts";
import { evaluateEquivalence } from "../benchmarks/state-equivalence/evaluate.ts";
import { fingerprintState } from "../src/core/fingerprint.ts";
import { fingerprintStateV2 } from "../src/core/fingerprintV2.ts";
import { fingerprintStateV3 } from "../src/core/fingerprintV3.ts";

const outputPath = resolve(
  process.argv[2] ?? "results/raw/phase-7-fingerprint-v3-comparison.json",
);
const summaryPath = outputPath.replace(/\.json$/i, "-summary.txt");

const browserGeneralizationUrl = pathToFileURL(
  resolve("benchmarks/browser-generalization/index.html"),
).href;
const explorerStrategyUrl = pathToFileURL(
  resolve("benchmarks/explorer-strategy/index.html"),
).href;
const adversarialIdentityUrl = pathToFileURL(
  resolve("benchmarks/adversarial-identity/index.html"),
).href;

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();

  const report = {
    schemaVersion: 1,
    experiment: "phase-7-fingerprint-v3-comparison",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    generatedAt: new Date().toISOString(),
    phase2Equivalence: {
      v1: evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintState),
      v2: evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintStateV2),
      v3: evaluateEquivalence(STATE_EQUIVALENCE_CASES, fingerprintStateV3),
    },
    phase4BrowserGeneralization: await evaluateBrowserGeneralization(
      page,
      browserGeneralizationUrl,
    ),
    phase5ExplorerStrategy: await compareExplorerStrategies(
      page,
      explorerStrategyUrl,
    ),
    phase6AdversarialIdentity: await evaluateAdversarialIdentity(
      page,
      adversarialIdentityUrl,
    ),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const phase2 = report.phase2Equivalence.v3;
  const phase4 = report.phase4BrowserGeneralization.v3;
  const phase5 = report.phase5ExplorerStrategy.v3;
  const phase6 = report.phase6AdversarialIdentity.v3;

  const summary = [
    "Phase 7 fingerprint-v3 summary",
    `Phase 2: ${phase2.correct}/${phase2.total}, false merges=${phase2.falseMergeCount}, false splits=${phase2.falseSplitCount}`,
    `Phase 4: ${phase4.correct}/${phase4.total}, false merges=${phase4.falseMerges}, false splits=${phase4.falseSplits}`,
    `Phase 5: states=${phase5.graphStates}, attempts=${phase5.attemptedTransitions}, coverage=${phase5.meaningfulStateCoverage}, excess=${phase5.excessStates}, failed=${phase5.failedTransitions}`,
    `Phase 6: ${phase6.correct}/${phase6.total}, false merges=${phase6.falseMerges}, false splits=${phase6.falseSplits}`,
    `Full JSON: ${outputPath}`,
  ].join("\n") + "\n";

  await writeFile(summaryPath, summary, "utf8");

  console.log(summary.trim());
  console.log(`Summary file: ${summaryPath}`);
} finally {
  await browser.close();
}
