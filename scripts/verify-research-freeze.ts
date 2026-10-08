import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface FreezeManifest {
  schemaVersion: 1;
  kind: "statescout-research-freeze";
  freezeBaseCommit: string;
  protectedTrees: Record<string, string>;
  finalVerifiedSuite: {
    tests: number;
    pass: number;
    fail: number;
  };
}

const manifestPath = resolve("research/freeze-manifest.json");
const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8"),
) as FreezeManifest;

function git(...args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
  }).trim();
}

if (
  manifest.schemaVersion !== 1 ||
  manifest.kind !== "statescout-research-freeze"
) {
  throw new Error("Unsupported research freeze manifest.");
}

try {
  execFileSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      manifest.freezeBaseCommit,
      "HEAD",
    ],
    { stdio: "ignore" },
  );
} catch {
  throw new Error(
    `Freeze base ${manifest.freezeBaseCommit} is not an ancestor of HEAD.`,
  );
}

const rows = Object.entries(manifest.protectedTrees).map(
  ([path, expectedTree]) => {
    const actualTree = git("rev-parse", `HEAD:${path}`);
    return {
      path,
      expectedTree,
      actualTree,
      matches: expectedTree === actualTree,
    };
  },
);

const failed = rows.filter((row) => !row.matches);

console.log("StateScout research-freeze verification");
console.log(`Freeze base: ${manifest.freezeBaseCommit}`);
for (const row of rows) {
  console.log(
    `${row.path}: ${row.matches ? "MATCH" : "DRIFT"} (${row.actualTree})`,
  );
}
console.log(
  `Frozen verified suite: ${manifest.finalVerifiedSuite.pass}/${manifest.finalVerifiedSuite.tests} passed`,
);
console.log(`Research freeze intact: ${failed.length === 0}`);

if (failed.length > 0) {
  process.exitCode = 2;
}
