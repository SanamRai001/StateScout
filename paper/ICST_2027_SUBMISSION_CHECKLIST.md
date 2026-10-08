# ICST 2027 Submission Checklist

## Deadline

Full paper: **2026-11-02 AoE**.

## Format gate

- [ ] IEEE two-column conference template.
- [ ] <=10 pages for all body text, figures, tables, appendices.
- [ ] <=2 additional reference-only pages.
- [ ] double-anonymous manuscript.
- [ ] anonymized artifact and URLs.

## Scientific gate

- [ ] State abstraction itself is never claimed as novel.
- [ ] Dynamic abstraction refinement/model rebuilding is explicitly credited to APE.
- [ ] Judge, FragGen, WebEmbed, Crawljax, WebMate, and APE are discussed.
- [ ] strongest novelty wording is qualified: "to our knowledge, in the reviewed literature."
- [ ] no SOTA classifier claim without head-to-head reproduction.
- [ ] original Phase 19 result and later replication remain separate.
- [ ] Phase 20 timing is not presented as an asymptotic performance claim.
- [ ] limitations of small controlled corpus are explicit.

## Citation gate

Run:

```powershell
npm run paper:check-citations
```

Must report:

```text
Missing bibliography keys: none
```

Before submission, manually verify each bibliography record against publisher/DOI/DBLP or another primary bibliographic source.

## Reproduction gate

From a clean checkout of the frozen artifact:

```powershell
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run experiment:phase21
npm run research:reproduce-controlled
npm run paper:build-assets
npm run paper:check-citations
```

Do not require the external Phase 19 rerun for deterministic artifact reproducibility.

## Artifact gate

- [ ] anonymized repository or archive.
- [ ] no author-revealing GitHub username in paper/artifact URL.
- [ ] README quick start.
- [ ] exact Node version.
- [ ] Chromium install step.
- [ ] expected command outputs.
- [ ] freeze commit/tree identities.
- [ ] raw controlled JSON outputs.
- [ ] generated tables/figures and asset manifest.
- [ ] license.
- [ ] archival DOI if practical.

## AI-use disclosure gate

ICST 2027 requires disclosure of AI-generated text, figures/images, or code.

Prepare an anonymized acknowledgment such as:

> Generative AI tools were used during development and manuscript preparation for interactive coding assistance, language drafting/editing, and generation/refinement of reporting scripts and figure specifications. All research claims, experimental designs, benchmark labels, source code changes, references, numerical results, and final manuscript content were reviewed and verified by the author. The frozen research artifact and raw experiment outputs are provided for independent verification.

This wording must be adjusted to accurately reflect the final submission and IEEE/ICST policy at submission time.

## Final human review

Before uploading:

- [ ] read the PDF end-to-end on paper/screen;
- [ ] verify no author identity leakage;
- [ ] verify every figure label at 100% PDF zoom;
- [ ] check table values against generated assets;
- [ ] check every in-text citation renders;
- [ ] check reference page limit;
- [ ] have an independent reader challenge the novelty paragraph;
- [ ] spellcheck;
- [ ] inspect PDF metadata for identity leakage where required by double-blind review.
