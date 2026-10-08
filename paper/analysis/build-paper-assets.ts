import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = process.cwd();

const inputs = {
  phase13: resolve(
    ROOT,
    "results/raw/phase-13-profile-revalidation.json",
  ),
  phase16: resolve(
    ROOT,
    "results/raw/phase-16-reversible-equivalence.json",
  ),
  phase18: resolve(
    ROOT,
    "results/raw/phase-18-baselines-ablations.json",
  ),
  phase20: resolve(
    ROOT,
    "results/raw/phase-20-scalability-recovery.json",
  ),
} as const;

const outputs = {
  phase18Table: resolve(
    ROOT,
    "paper/tables/table-phase18-ablation.md",
  ),
  phase18Csv: resolve(
    ROOT,
    "paper/tables/table-phase18-ablation.csv",
  ),
  phase20Table: resolve(
    ROOT,
    "paper/tables/table-phase20-recovery.md",
  ),
  phase18Figure: resolve(
    ROOT,
    "paper/figures/fig-phase18-ablation.svg",
  ),
  phase13Figure: resolve(
    ROOT,
    "paper/figures/fig-phase13-revocation.svg",
  ),
  phase16Figure: resolve(
    ROOT,
    "paper/figures/fig-phase16-reprojection.svg",
  ),
  manifest: resolve(
    ROOT,
    "paper/assets-manifest.json",
  ),
} as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson<T>(path: string): Promise<{
  raw: string;
  value: T;
}> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    throw new Error(
      `Missing required experiment output: ${path}\nRun the corresponding experiment before building paper assets.`,
    );
  }

  return {
    raw,
    value: JSON.parse(raw) as T,
  };
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDocument(
  width: number,
  height: number,
  content: string,
): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    '<style>',
    'text{font-family:Arial,Helvetica,sans-serif;fill:#111}',
    '.title{font-size:18px;font-weight:700}',
    '.label{font-size:12px}',
    '.small{font-size:10px}',
    '.axis{stroke:#777;stroke-width:1}',
    '.bar{fill:#555}',
    '.bar2{fill:#999}',
    '.line{stroke:#444;stroke-width:2;fill:none}',
    '</style>',
    content,
    '</svg>',
  ].join("\n") + "\n";
}

interface Phase13Report {
  staleProfileFutureRun: {
    meaningfulDetailsCoverage: number;
    states: number;
    transitions: number;
    attempts: number;
  };
  revokedProfileFutureRun: {
    meaningfulDetailsCoverage: number;
    states: number;
    transitions: number;
    attempts: number;
    failedTransitions: number;
  };
}

interface Phase16Report {
  raw: {
    observations: number;
    transitions: number;
    roundTripStable: boolean;
  };
  trustedProjection: {
    states: number;
    transitions: number;
    dashboardMembers: number;
  };
  revokedProjection: {
    states: number;
    transitions: number;
    dashboardStates: number;
  };
  restoredProjection: {
    states: number;
    transitions: number;
  };
  rawArchiveDigestStable: boolean;
}

interface Phase18Strategy {
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  falseMerges: number;
  falseSplits: number;
  failures: string[];
}

interface Phase18Report {
  observedPairs: number;
  strategies: Phase18Strategy[];
}

interface Phase20Report {
  syntheticScale: Array<{
    states: number;
    transitions: number;
    attempts: number;
    failedTransitions: number;
    durationMs: number;
    heapDeltaBytes: number;
  }>;
  syntheticCheckpointRecovery: {
    interruptAfterAttempts: number;
    finalAttempts: number;
    finalStates: number;
    finalTransitions: number;
    finalFailedTransitions: number;
    checkpointBytes: number;
    resumedMatchesUninterrupted: boolean;
    corruptedCheckpointRejected: boolean;
  };
  browserDeepReplay: {
    states: number;
    transitions: number;
    attempts: number;
    observationCounts: {
      "replay-step": number;
      "restored-source": number;
      "after-interaction": number;
    };
    checkpointInterruptAfterAttempts: number;
    checkpointBytes: number;
    resumedAttempts: number;
    resumedMatchesUninterrupted: boolean;
  };
}

function phase18Table(report: Phase18Report): {
  markdown: string;
  csv: string;
} {
  const header =
    "| Strategy | Correct | Accuracy | False merges | False splits |\n| --- | ---: | ---: | ---: | ---: |";
  const rows = report.strategies.map(
    (s) =>
      `| ${s.name} | ${s.correct}/${s.total} | ${s.accuracy.toFixed(4)} | ${s.falseMerges} | ${s.falseSplits} |`,
  );

  const markdown = [
    "# Phase 18 State-Abstraction Comparison",
    "",
    "Generated from `results/raw/phase-18-baselines-ablations.json`.",
    "",
    header,
    ...rows,
    "",
  ].join("\n");

  const csv = [
    "strategy,correct,total,accuracy,false_merges,false_splits",
    ...report.strategies.map(
      (s) =>
        [
          s.name,
          s.correct,
          s.total,
          s.accuracy,
          s.falseMerges,
          s.falseSplits,
        ].join(","),
    ),
    "",
  ].join("\n");

  return { markdown, csv };
}

function phase20Table(report: Phase20Report): string {
  const rows = report.syntheticScale.map(
    (s) =>
      `| ${s.states} | ${s.transitions} | ${s.attempts} | ${s.failedTransitions} | ${s.durationMs.toFixed(3)} | ${s.heapDeltaBytes} |`,
  );

  return [
    "# Phase 20 Scalability and Recovery",
    "",
    "Generated from `results/raw/phase-20-scalability-recovery.json`.",
    "",
    "| States | Transitions | Attempts | Injected failures | Duration ms | Heap delta bytes |",
    "| ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    "## Checkpoint recovery",
    "",
    `- Synthetic interruption/final attempts: ${report.syntheticCheckpointRecovery.interruptAfterAttempts}/${report.syntheticCheckpointRecovery.finalAttempts}`,
    `- Synthetic final states/transitions/failed: ${report.syntheticCheckpointRecovery.finalStates}/${report.syntheticCheckpointRecovery.finalTransitions}/${report.syntheticCheckpointRecovery.finalFailedTransitions}`,
    `- Synthetic checkpoint bytes: ${report.syntheticCheckpointRecovery.checkpointBytes}`,
    `- Synthetic resumed equals uninterrupted: ${report.syntheticCheckpointRecovery.resumedMatchesUninterrupted}`,
    `- Corrupted checkpoint rejected: ${report.syntheticCheckpointRecovery.corruptedCheckpointRejected}`,
    `- Browser deep replay states/transitions/attempts: ${report.browserDeepReplay.states}/${report.browserDeepReplay.transitions}/${report.browserDeepReplay.attempts}`,
    `- Browser replay-step observations: ${report.browserDeepReplay.observationCounts["replay-step"]}`,
    `- Browser interruption/final attempts: ${report.browserDeepReplay.checkpointInterruptAfterAttempts}/${report.browserDeepReplay.resumedAttempts}`,
    `- Browser checkpoint bytes: ${report.browserDeepReplay.checkpointBytes}`,
    `- Browser resumed equals uninterrupted: ${report.browserDeepReplay.resumedMatchesUninterrupted}`,
    "",
  ].join("\n");
}

function phase18Figure(report: Phase18Report): string {
  const width = 960;
  const height = 520;
  const left = 70;
  const top = 60;
  const chartH = 340;
  const chartW = 850;
  const maxCorrect = Math.max(
    ...report.strategies.map((s) => s.total),
  );
  const slot = chartW / report.strategies.length;
  const barW = Math.min(52, slot * 0.58);

  const bars = report.strategies
    .map((s, index) => {
      const x = left + index * slot + (slot - barW) / 2;
      const h = (s.correct / maxCorrect) * chartH;
      const y = top + chartH - h;
      const label =
        s.name.length > 18
          ? s.name.replace("v4-", "v4-\n")
          : s.name;
      const lines = label.split("\n");
      return [
        `<rect class="bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}"/>`,
        `<text class="label" x="${(x + barW / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle">${s.correct}/${s.total}</text>`,
        ...lines.map(
          (line, li) =>
            `<text class="small" x="${(x + barW / 2).toFixed(1)}" y="${top + chartH + 24 + li * 12}" text-anchor="middle">${esc(line)}</text>`,
        ),
        `<text class="small" x="${(x + barW / 2).toFixed(1)}" y="${top + chartH + 52}" text-anchor="middle">FM ${s.falseMerges} / FS ${s.falseSplits}</text>`,
      ].join("\n");
    })
    .join("\n");

  const ticks = [0, 4, 8, 12, 16]
    .map((v) => {
      const y = top + chartH - (v / maxCorrect) * chartH;
      return [
        `<line class="axis" x1="${left - 6}" y1="${y}" x2="${left + chartW}" y2="${y}" opacity="0.18"/>`,
        `<text class="small" x="${left - 12}" y="${y + 4}" text-anchor="end">${v}</text>`,
      ].join("\n");
    })
    .join("\n");

  return svgDocument(
    width,
    height,
    [
      '<text class="title" x="30" y="30">Phase 18: Correctly classified state pairs</text>',
      '<text class="small" x="30" y="47">Bars show correct pairs out of 16; labels also report false merges (FM) and false splits (FS).</text>',
      ticks,
      `<line class="axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + chartH}"/>`,
      `<line class="axis" x1="${left}" y1="${top + chartH}" x2="${left + chartW}" y2="${top + chartH}"/>`,
      bars,
    ].join("\n"),
  );
}

function phase13Figure(report: Phase13Report): string {
  const width = 620;
  const height = 390;
  const baseY = 300;
  const maxH = 220;
  const cases = [
    {
      label: "Stale trusted profile",
      coverage: report.staleProfileFutureRun.meaningfulDetailsCoverage,
      states: report.staleProfileFutureRun.states,
      transitions: report.staleProfileFutureRun.transitions,
    },
    {
      label: "After revocation",
      coverage: report.revokedProfileFutureRun.meaningfulDetailsCoverage,
      states: report.revokedProfileFutureRun.states,
      transitions: report.revokedProfileFutureRun.transitions,
    },
  ];

  const bars = cases
    .map((c, i) => {
      const x = 150 + i * 260;
      const h = c.coverage * maxH;
      return [
        `<rect class="bar" x="${x}" y="${baseY - h}" width="100" height="${h}"/>`,
        `<text class="label" x="${x + 50}" y="${baseY - h - 10}" text-anchor="middle">${c.coverage.toFixed(1)}</text>`,
        `<text class="label" x="${x + 50}" y="${baseY + 24}" text-anchor="middle">${esc(c.label)}</text>`,
        `<text class="small" x="${x + 50}" y="${baseY + 42}" text-anchor="middle">${c.states} states / ${c.transitions} transitions</text>`,
      ].join("\n");
    })
    .join("\n");

  return svgDocument(
    width,
    height,
    [
      '<text class="title" x="30" y="32">Phase 13: Coverage after abstraction drift</text>',
      '<text class="small" x="30" y="51">Controlled meaningful-details coverage before and after revoking stale trust.</text>',
      '<line class="axis" x1="80" y1="80" x2="80" y2="300"/>',
      '<line class="axis" x1="80" y1="300" x2="570" y2="300"/>',
      '<text class="small" x="68" y="304" text-anchor="end">0.0</text>',
      '<text class="small" x="68" y="194" text-anchor="end">0.5</text>',
      '<text class="small" x="68" y="84" text-anchor="end">1.0</text>',
      bars,
    ].join("\n"),
  );
}

function phase16Figure(report: Phase16Report): string {
  const width = 720;
  const height = 400;
  const baseY = 310;
  const maxH = 220;
  const maxStates = Math.max(
    report.raw.observations,
    report.trustedProjection.states,
    report.revokedProjection.states,
    report.restoredProjection.states,
  );
  const cases = [
    ["Trusted", report.trustedProjection.states],
    ["Revoked", report.revokedProjection.states],
    ["Restored", report.restoredProjection.states],
  ] as const;

  const bars = cases
    .map(([label, states], i) => {
      const x = 160 + i * 170;
      const h = (states / maxStates) * maxH;
      return [
        `<rect class="bar" x="${x}" y="${baseY - h}" width="85" height="${h}"/>`,
        `<text class="label" x="${x + 42.5}" y="${baseY - h - 9}" text-anchor="middle">${states}</text>`,
        `<text class="label" x="${x + 42.5}" y="${baseY + 24}" text-anchor="middle">${label}</text>`,
      ].join("\n");
    })
    .join("\n");

  const rawY =
    baseY - (report.raw.observations / maxStates) * maxH;

  return svgDocument(
    width,
    height,
    [
      '<text class="title" x="30" y="32">Phase 16: Reversible projection over immutable observations</text>',
      `<text class="small" x="30" y="51">Raw archive: ${report.raw.observations} observations / ${report.raw.transitions} transitions; digest stable = ${report.rawArchiveDigestStable}.</text>`,
      '<line class="axis" x1="90" y1="90" x2="90" y2="310"/>',
      '<line class="axis" x1="90" y1="310" x2="660" y2="310"/>',
      `<line class="line" x1="105" y1="${rawY}" x2="650" y2="${rawY}" stroke-dasharray="6 5"/>`,
      `<text class="small" x="650" y="${rawY - 6}" text-anchor="end">raw observations = ${report.raw.observations}</text>`,
      bars,
    ].join("\n"),
  );
}

const phase13 = await readJson<Phase13Report>(inputs.phase13);
const phase16 = await readJson<Phase16Report>(inputs.phase16);
const phase18 = await readJson<Phase18Report>(inputs.phase18);
const phase20 = await readJson<Phase20Report>(inputs.phase20);

const p18 = phase18Table(phase18.value);

const generated: Record<string, string> = {
  [outputs.phase18Table]: p18.markdown,
  [outputs.phase18Csv]: p18.csv,
  [outputs.phase20Table]: phase20Table(phase20.value),
  [outputs.phase18Figure]: phase18Figure(phase18.value),
  [outputs.phase13Figure]: phase13Figure(phase13.value),
  [outputs.phase16Figure]: phase16Figure(phase16.value),
};

for (const [path, content] of Object.entries(generated)) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

const inputRecords = Object.entries({
  phase13,
  phase16,
  phase18,
  phase20,
}).map(([name, value]) => ({
  name,
  path: inputs[name as keyof typeof inputs],
  sha256: sha256(value.raw),
}));

const outputRecords = await Promise.all(
  Object.keys(generated).map(async (path) => {
    const raw = await readFile(path, "utf8");
    return {
      path,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    };
  }),
);

const manifest = {
  schemaVersion: 1,
  kind: "statescout-paper-assets",
  generatedAt: new Date().toISOString(),
  inputs: inputRecords,
  outputs: outputRecords,
};

await mkdir(dirname(outputs.manifest), { recursive: true });
await writeFile(
  outputs.manifest,
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

console.log("StateScout paper assets built");
for (const output of outputRecords) {
  console.log(
    `${output.path}: ${output.bytes} bytes, sha256=${output.sha256}`,
  );
}
console.log(`Manifest: ${outputs.manifest}`);
