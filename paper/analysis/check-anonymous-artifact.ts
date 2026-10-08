import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  relative,
  resolve,
  sep,
} from "node:path";

const ROOT = resolve(
  process.argv[2] ?? "dist/statescout-icst2027-anonymous",
);

function listFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (path: string) => {
    for (const entry of readdirSync(path, {
      withFileTypes: true,
    }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = resolve(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  walk(root);
  return out;
}

function sha256(path: string): string {
  return createHash("sha256")
    .update(readFileSync(path))
    .digest("hex");
}

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) {
  throw new Error(`Anonymous artifact directory not found: ${ROOT}`);
}

const required = [
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "research/anonymous-freeze-manifest.json",
  "research/artifact-manifest.json",
  "src",
  "benchmarks",
  "tests",
  "scripts",
  "results/raw/phase-13-profile-revalidation.json",
  "results/raw/phase-16-reversible-equivalence.json",
  "results/raw/phase-18-baselines-ablations.json",
  "results/raw/phase-20-scalability-recovery.json",
];

const missing = required.filter(
  (path) => !existsSync(resolve(ROOT, path)),
);

const forbiddenEntries = [
  ".git",
  ".github",
  "paper",
  "node_modules",
];

const forbiddenPresent = forbiddenEntries.filter(
  (path) => existsSync(resolve(ROOT, path)),
);

const pkg = JSON.parse(
  readFileSync(resolve(ROOT, "package.json"), "utf8"),
) as {
  scripts?: Record<string, string>;
};

const scripts = pkg.scripts ?? {};
const paperScripts = Object.keys(scripts)
  .filter((key) => key.startsWith("paper:"))
  .sort();

const requiredScripts = [
  "artifact:verify-freeze",
  "artifact:smoke",
  "research:reproduce-controlled",
];

const missingScripts = requiredScripts.filter(
  (key) => !(key in scripts),
);

const manifest = JSON.parse(
  readFileSync(
    resolve(ROOT, "research/artifact-manifest.json"),
    "utf8",
  ),
) as {
  schemaVersion?: number;
  kind?: string;
  packageLockIncluded?: boolean;
  controlledResults?: Array<{
    file: string;
    sha256: string;
    bytes: number;
  }>;
};

const resultErrors: string[] = [];
for (const record of manifest.controlledResults ?? []) {
  const path = resolve(ROOT, record.file);
  if (!existsSync(path)) {
    resultErrors.push(`missing: ${record.file}`);
    continue;
  }

  const actualBytes = readFileSync(path).byteLength;
  const actualHash = sha256(path);

  if (actualHash !== record.sha256) {
    resultErrors.push(`sha256 mismatch: ${record.file}`);
  }
  if (actualBytes !== record.bytes) {
    resultErrors.push(`byte-count mismatch: ${record.file}`);
  }
}

const forbiddenPatterns = [
  { label: "author name", re: /Sanam\s+Rai/gi },
  { label: "GitHub handle", re: /SanamRai001/gi },
  { label: "personal domain", re: /sanam-rai\.com\.np/gi },
  { label: "Windows user path", re: /C:\\Users\\DELL/gi },
  { label: "local project path", re: /D:\\Projects\\StateScout/gi },
  { label: "public freeze commit", re: /d4aa27d4e2516555a30741f9829785b0db12316e/gi },
  { label: "public paper merge commit", re: /0fdba9f8f617c3820f3e81743b4c36e74a7534ba/gi },
];

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
  ".csv",
]);

const leaks: Array<{
  file: string;
  label: string;
  match: string;
}> = [];

for (const file of listFiles(ROOT)) {
  const ext = file.slice(file.lastIndexOf("."));
  if (!textExtensions.has(ext)) continue;

  const content = readFileSync(file, "utf8");
  for (const rule of forbiddenPatterns) {
    rule.re.lastIndex = 0;
    for (const match of content.matchAll(rule.re)) {
      leaks.push({
        file: relative(ROOT, file).split(sep).join("/"),
        label: rule.label,
        match: match[0],
      });
    }
  }
}

const manifestOk =
  manifest.schemaVersion === 1 &&
  manifest.kind === "statescout-anonymous-artifact" &&
  manifest.packageLockIncluded === true;

const ok =
  missing.length === 0 &&
  forbiddenPresent.length === 0 &&
  paperScripts.length === 0 &&
  missingScripts.length === 0 &&
  manifestOk &&
  resultErrors.length === 0 &&
  leaks.length === 0;

console.log("StateScout anonymous artifact preflight");
console.log(`Root: ${ROOT}`);
console.log(`Required paths missing: ${missing.length}`);
console.log(`Forbidden entries present: ${forbiddenPresent.length}`);
console.log(`paper:* scripts present: ${paperScripts.length}`);
console.log(`Required artifact scripts missing: ${missingScripts.length}`);
console.log(`Artifact manifest valid: ${manifestOk}`);
console.log(`Controlled-result integrity errors: ${resultErrors.length}`);
console.log(`Identity leaks: ${leaks.length}`);
console.log(`Anonymous artifact preflight: ${ok ? "PASS" : "FAIL"}`);

for (const value of missing) console.log(`- missing: ${value}`);
for (const value of forbiddenPresent) console.log(`- forbidden: ${value}`);
for (const value of paperScripts) console.log(`- paper script: ${value}`);
for (const value of missingScripts) console.log(`- missing script: ${value}`);
for (const value of resultErrors) console.log(`- result: ${value}`);
for (const leak of leaks) {
  console.log(
    `- leak: ${leak.label}: ${leak.file}: ${JSON.stringify(leak.match)}`,
  );
}

if (!ok) process.exitCode = 2;
