import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const roots = [
  resolve("paper/icst2027"),
];

const forbidden = [
  { label: "author name", pattern: /Sanam\s+Rai/gi },
  { label: "GitHub handle", pattern: /SanamRai001/gi },
  { label: "personal domain", pattern: /sanam-rai\.com\.np/gi },
  { label: "Windows user path", pattern: /C:\\Users\\DELL/gi },
  { label: "local project path", pattern: /D:\\Projects\\StateScout/gi },
];

const allowedExtensions = new Set([
  ".tex",
  ".md",
  ".txt",
  ".bib",
  ".json",
  ".csv",
  ".yml",
  ".yaml",
]);

function walk(path: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(path)) {
    const full = join(path, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (allowedExtensions.has(extname(full).toLowerCase())) out.push(full);
  }
  return out;
}

const findings: Array<{
  file: string;
  label: string;
  match: string;
}> = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const content = readFileSync(file, "utf8");
    for (const rule of forbidden) {
      rule.pattern.lastIndex = 0;
      for (const match of content.matchAll(rule.pattern)) {
        findings.push({
          file: relative(process.cwd(), file),
          label: rule.label,
          match: match[0],
        });
      }
    }
  }
}

console.log("StateScout ICST anonymity audit");
console.log(`Files scanned: ${roots.map((root) => walk(root).length).reduce((a, b) => a + b, 0)}`);
console.log(`Identity leaks: ${findings.length}`);

for (const finding of findings) {
  console.log(
    `- ${finding.label}: ${finding.file}: ${JSON.stringify(finding.match)}`,
  );
}

if (findings.length > 0) {
  process.exitCode = 2;
}
