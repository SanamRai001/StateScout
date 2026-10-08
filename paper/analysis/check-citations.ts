import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manuscriptPath = resolve("paper/MANUSCRIPT_V0_1.md");
const bibliographyPath = resolve("paper/references.bib");

const manuscript = readFileSync(manuscriptPath, "utf8");
const bibliography = readFileSync(bibliographyPath, "utf8");

const cited = new Set<string>();
for (const match of manuscript.matchAll(/@([A-Za-z0-9:_-]+)/g)) {
  cited.add(match[1]);
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
