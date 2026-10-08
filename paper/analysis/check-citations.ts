import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manuscriptPaths = [
  resolve("paper/MANUSCRIPT_V0_1.md"),
  resolve("paper/icst2027/main.tex"),
];
const bibliographyPath = resolve("paper/references.bib");

const manuscripts = manuscriptPaths.map((path) => ({
  path,
  content: readFileSync(path, "utf8"),
}));
const bibliography = readFileSync(bibliographyPath, "utf8");

const cited = new Set<string>();

for (const manuscript of manuscripts) {
  for (const match of manuscript.content.matchAll(/@([A-Za-z0-9:_-]+)/g)) {
    cited.add(match[1]);
  }

  for (const match of manuscript.content.matchAll(/\\cite\{([^}]+)\}/g)) {
    for (const key of match[1].split(",")) {
      const trimmed = key.trim();
      if (trimmed.length > 0) cited.add(trimmed);
    }
  }
}

const available = new Set<string>();
for (const match of bibliography.matchAll(
  /@[A-Za-z]+\s*\{\s*([^,\s]+)\s*,/g,
)) {
  available.add(match[1]);
}

const missing = [...cited]
  .filter((key) => !available.has(key))
  .sort();
const uncited = [...available]
  .filter((key) => !cited.has(key))
  .sort();

console.log("StateScout manuscript citation audit");
console.log(`Manuscripts checked: ${manuscriptPaths.length}`);
for (const path of manuscriptPaths) {
  console.log(`- ${path}`);
}
console.log(`Cited keys: ${cited.size}`);
console.log(`Bibliography entries: ${available.size}`);
console.log(
  `Missing bibliography keys: ${missing.length === 0 ? "none" : missing.join(", ")}`,
);
console.log(
  `Uncited bibliography entries: ${uncited.length === 0 ? "none" : uncited.join(", ")}`,
);

if (missing.length > 0) {
  process.exitCode = 2;
}
