import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

const ROOT = process.cwd();
const OUT = resolve(
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

function digestTree(path: string) {
  const root = resolve(path);
  const files = listFiles(root);
  const hash = createHash("sha256");

  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    hash.update(rel, "utf8");
    hash.update("\0", "utf8");
    hash.update(readFileSync(file));
    hash.update("\0", "utf8");
  }

  return {
    sha256: hash.digest("hex"),
    files: files.length,
  };
}

function copy(source: string, destination: string) {
  cpSync(resolve(source), resolve(OUT, destination), {
    recursive: true,
  });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const path of [
  "src",
  "benchmarks",
  "tests",
  "scripts",
]) {
  copy(path, path);
}

for (const path of ["package.json", "tsconfig.json"]) {
  copy(path, path);
}

copy(
  "paper/icst2027/ARTIFACT_README.md",
  "README.md",
);

mkdirSync(resolve(OUT, "research"), {
  recursive: true,
});

const protectedContent = {
  src: digestTree("src"),
  benchmarks: digestTree("benchmarks"),
  tests: digestTree("tests"),
};

writeFileSync(
  resolve(OUT, "research/anonymous-freeze-manifest.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      kind: "statescout-anonymous-freeze",
      protectedContent,
      note:
        "Content digests replace public Git commit/tree identifiers for double-anonymous review.",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

cpSync(
  resolve("paper/analysis/verify-anonymous-freeze.ts"),
  resolve(OUT, "scripts/verify-research-freeze.ts"),
);

const packagePath = resolve(OUT, "package.json");
const pkg = JSON.parse(
  readFileSync(packagePath, "utf8"),
) as {
  scripts?: Record<string, string>;
};

pkg.scripts ??= {};
pkg.scripts["experiment:phase21"] =
  "node --experimental-strip-types scripts/verify-research-freeze.ts";
pkg.scripts["artifact:verify-freeze"] =
  pkg.scripts["experiment:phase21"];

for (const key of Object.keys(pkg.scripts)) {
  if (key.startsWith("paper:")) {
    delete pkg.scripts[key];
  }
}

writeFileSync(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

const controlledResults = [
  "phase-13-profile-revalidation.json",
  "phase-16-reversible-equivalence.json",
  "phase-18-baselines-ablations.json",
  "phase-20-scalability-recovery.json",
];

for (const name of controlledResults) {
  const source = resolve("results/raw", name);
  if (!existsSync(source)) {
    throw new Error(
      `Missing controlled result required for anonymous artifact: ${source}`,
    );
  }

  const destination = resolve(
    OUT,
    "results/raw",
    name,
  );
  mkdirSync(dirname(destination), {
    recursive: true,
  });
  cpSync(source, destination);
}

const recordedRealWorld = resolve(
  "paper/tables/table-real-world-replication.md",
);
if (existsSync(recordedRealWorld)) {
  const destination = resolve(
    OUT,
    "results/recorded/phase19-original-and-replication.md",
  );
  mkdirSync(dirname(destination), {
    recursive: true,
  });
  cpSync(recordedRealWorld, destination);
}

const forbidden = [
  /Sanam\s+Rai/gi,
  /SanamRai001/gi,
  /sanam-rai\.com\.np/gi,
  /C:\\Users\\DELL/gi,
  /D:\\Projects\\StateScout/gi,
  /d4aa27d4e2516555a30741f9829785b0db12316e/gi,
  /c053a1f0be4bc5ca2c51919b12624e72e9d6b4fd/gi,
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
  match: string;
}> = [];

for (const file of listFiles(OUT)) {
  const ext = file.slice(file.lastIndexOf("."));
  if (!textExtensions.has(ext)) continue;

  const content = readFileSync(file, "utf8");

  for (const rule of forbidden) {
    rule.lastIndex = 0;
    for (const match of content.matchAll(rule)) {
      leaks.push({
        file: relative(OUT, file).split(sep).join("/"),
        match: match[0],
      });
    }
  }
}

if (leaks.length > 0) {
  console.error(
    "Anonymous artifact identity-leak audit failed:",
  );
  for (const leak of leaks) {
    console.error(
      `- ${leak.file}: ${JSON.stringify(leak.match)}`,
    );
  }
  process.exit(2);
}

console.log("StateScout anonymous artifact staged");
console.log(`Output: ${OUT}`);
for (const [path, digest] of Object.entries(
  protectedContent,
)) {
  console.log(
    `${path}: ${digest.sha256} (${digest.files} files)`,
  );
}
console.log("Identity leaks: 0");
console.log(
  "Public Git history/commit identifiers are not required by the staged artifact verifier.",
);
