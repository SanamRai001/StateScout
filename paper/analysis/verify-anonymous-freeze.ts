import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

interface AnonymousFreezeManifest {
  schemaVersion: 1;
  kind: "statescout-anonymous-freeze";
  protectedContent: Record<
    string,
    {
      sha256: string;
      files: number;
    }
  >;
}

function listFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (path: string) => {
    const entries = readdirSync(path, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = resolve(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  walk(root);
  return out;
}

function digestTree(path: string): { sha256: string; files: number } {
  const root = resolve(path);
  const files = listFiles(root);
  const hash = createHash("sha256");

  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    const bytes = readFileSync(file);
    hash.update(rel, "utf8");
    hash.update("\0", "utf8");
    hash.update(bytes);
    hash.update("\0", "utf8");
  }

  return {
    sha256: hash.digest("hex"),
    files: files.length,
  };
}

const manifest = JSON.parse(
  readFileSync(
    resolve("research/anonymous-freeze-manifest.json"),
    "utf8",
  ),
) as AnonymousFreezeManifest;

if (
  manifest.schemaVersion !== 1 ||
  manifest.kind !== "statescout-anonymous-freeze"
) {
  throw new Error("Unsupported anonymous freeze manifest.");
}

let ok = true;

console.log("StateScout anonymous snapshot verification");

for (const [path, expected] of Object.entries(
  manifest.protectedContent,
)) {
  const actual = digestTree(path);
  const matches =
    actual.sha256 === expected.sha256 &&
    actual.files === expected.files;

  console.log(
    `${path}: ${matches ? "MATCH" : "DRIFT"} (${actual.sha256}, ${actual.files} files)`,
  );

  if (!matches) ok = false;
}

console.log(`Anonymous research snapshot intact: ${ok}`);

if (!ok) process.exitCode = 2;
