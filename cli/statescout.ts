#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

import { exploreWithPlaywright } from "../src/browser/explorer.ts";

interface CliOptions {
  startUrl: string;
  maxTransitions: number;
  outputDir?: string;
  headed: boolean;
  timeoutMs: number;
  json: boolean;
}

interface RunSummary {
  schemaVersion: 1;
  startUrl: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  headed: boolean;
  maxTransitions: number;
  attemptedTransitions: number;
  states: number;
  transitions: number;
  statuses: Record<string, number>;
  evidenceErrors: readonly string[];
  outputDirectory: string;
}

function usage(): string {
  return [
    "StateScout - semantic web UI explorer",
    "",
    "Usage:",
    "  statescout <url> [options]",
    "",
    "Examples:",
    "  statescout https://example.com",
    "  statescout example.com --max-transitions 20",
    "  statescout http://localhost:3000 --headed",
    "  statescout https://example.com --output ./statescout-runs/example",
    "",
    "Options:",
    "  --max-transitions <n>  Maximum executed safe transitions (default: 25)",
    "  --output <dir>         Output directory (default: ./statescout-runs/<host>-<time>)",
    "  --timeout <ms>         Playwright action/navigation timeout (default: 15000)",
    "  --headed               Show the Chromium window while exploring",
    "  --json                 Print the final summary as JSON",
    "  -h, --help             Show this help",
    "",
    "Safety:",
    "  StateScout stays on the starting origin and uses the frozen safe-only",
    "  action policy. Mutating, destructive, and unknown-risk interactions are",
    "  not executed by this CLI.",
  ].join("\n");
}

function positiveInteger(value: string | undefined, flag: string): number {
  if (value === undefined) {
    throw new Error(`${flag} requires a value.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("A URL is required.");
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
    ? trimmed
    : /^(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("StateScout CLI accepts only HTTP(S) URLs.");
  }

  return url.href;
}

function parseArgs(argv: readonly string[]): CliOptions | "help" {
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    return "help";
  }

  let startUrl: string | undefined;
  let maxTransitions = 25;
  let outputDir: string | undefined;
  let headed = false;
  let timeoutMs = 15_000;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--max-transitions":
        maxTransitions = positiveInteger(argv[++index], "--max-transitions");
        break;
      case "--output": {
        const value = argv[++index];
        if (!value) throw new Error("--output requires a directory.");
        outputDir = value;
        break;
      }
      case "--timeout":
        timeoutMs = positiveInteger(argv[++index], "--timeout");
        break;
      case "--headed":
        headed = true;
        break;
      case "--json":
        json = true;
        break;
      default:
        if (arg?.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        if (startUrl !== undefined) {
          throw new Error("Only one start URL may be supplied.");
        }
        if (arg !== undefined) startUrl = arg;
    }
  }

  if (startUrl === undefined) {
    throw new Error("A start URL is required.");
  }

  return {
    startUrl: normalizeUrl(startUrl),
    maxTransitions,
    ...(outputDir !== undefined ? { outputDir } : {}),
    headed,
    timeoutMs,
    json,
  };
}

function safeHost(value: string): string {
  return new URL(value).host.replace(/[^a-zA-Z0-9.-]+/g, "-") || "site";
}

function timestampForPath(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function countStatuses(
  transitions: readonly { status: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const transition of transitions) {
    counts[transition.status] = (counts[transition.status] ?? 0) + 1;
  }
  return counts;
}

async function run(options: CliOptions): Promise<RunSummary> {
  const started = new Date();
  const outputDirectory = resolve(
    options.outputDir ??
      `statescout-runs/${safeHost(options.startUrl)}-${timestampForPath(started)}`,
  );

  mkdirSync(outputDirectory, { recursive: true });

  if (!options.json) {
    console.log("StateScout");
    console.log(`Target: ${options.startUrl}`);
    console.log(`Mode: ${options.headed ? "headed" : "headless"} / safe-only / same-origin`);
    console.log(`Max transitions: ${options.maxTransitions}`);
    console.log("");
  }

  const browser = await chromium.launch({
    headless: !options.headed,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(options.timeoutMs);
    page.setDefaultNavigationTimeout(options.timeoutMs);

    const observations: unknown[] = [];

    const result = await exploreWithPlaywright(page, {
      startUrl: options.startUrl,
      maxTransitions: options.maxTransitions,
      observationSink(observation) {
        observations.push(observation);
      },
      checkpointSink(checkpoint) {
        if (options.json) return;
        process.stdout.write(
          `\rExploring... attempts ${checkpoint.payload.attemptedTransitions} | states ${checkpoint.payload.graph.states.length} | transitions ${checkpoint.payload.graph.transitions.length}   `,
        );
      },
    });

    if (!options.json) process.stdout.write("\n");

    const graph = result.graph.exportSnapshot();
    const finished = new Date();
    const summary: RunSummary = {
      schemaVersion: 1,
      startUrl: options.startUrl,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      durationMs: finished.getTime() - started.getTime(),
      headed: options.headed,
      maxTransitions: options.maxTransitions,
      attemptedTransitions: result.attemptedTransitions,
      states: graph.states.length,
      transitions: graph.transitions.length,
      statuses: countStatuses(graph.transitions),
      evidenceErrors: result.evidenceErrors,
      outputDirectory,
    };

    writeFileSync(
      resolve(outputDirectory, "summary.json"),
      JSON.stringify(summary, null, 2) + "\n",
      "utf8",
    );
    writeFileSync(
      resolve(outputDirectory, "graph.json"),
      JSON.stringify(graph, null, 2) + "\n",
      "utf8",
    );
    writeFileSync(
      resolve(outputDirectory, "checkpoint.json"),
      JSON.stringify(result.checkpoint, null, 2) + "\n",
      "utf8",
    );
    writeFileSync(
      resolve(outputDirectory, "observations.json"),
      JSON.stringify(observations, null, 2) + "\n",
      "utf8",
    );

    return summary;
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  let parsed: CliOptions | "help";

  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `StateScout: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error("");
    console.error(usage());
    process.exitCode = 2;
    return;
  }

  if (parsed === "help") {
    console.log(usage());
    return;
  }

  try {
    const summary = await run(parsed);

    if (parsed.json) {
      console.log(JSON.stringify(summary));
      return;
    }

    console.log("");
    console.log("Run complete");
    console.log(`States: ${summary.states}`);
    console.log(`Transitions: ${summary.transitions}`);
    console.log(`Attempts: ${summary.attemptedTransitions}`);
    console.log(
      `Observed / blocked / failed / unchanged: ${summary.statuses.observed ?? 0} / ${summary.statuses["blocked-by-policy"] ?? 0} / ${summary.statuses.failed ?? 0} / ${summary.statuses["no-state-change"] ?? 0}`,
    );
    console.log(`Results: ${summary.outputDirectory}`);
  } catch (error) {
    console.error("");
    console.error(
      `StateScout failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}

await main();
