# ICST 2027 Submission Checklist

## Deadline

Full paper: **2026-11-02 AoE**.

## Format gate

Automated/rendered verification on 2026-10-08 (paper branch head `e5cced4`):

- [x] IEEE two-column conference template compiles in CI.
- [x] Current draft is 5 total US-Letter pages, safely below the 10-body + 2-reference venue ceiling.
- [x] double-anonymous manuscript header.
- [x] PDF metadata has a blank `/Author` field and submission-facing PDF text contains no known author name/handle/domain/local-path leak.
- [ ] anonymized artifact hosting/URL created for actual reviewer access.

## Scientific gate

- [x] State abstraction itself is never claimed as novel.
- [x] Dynamic abstraction refinement/model rebuilding is explicitly credited to APE.
- [x] Judge, FragGen, WebEmbed, Crawljax, WebMate, and APE are discussed.
- [x] strongest novelty wording is qualified: "to our knowledge, in the reviewed literature."
- [x] no SOTA classifier claim without head-to-head reproduction.
- [x] original Phase 19 result and later replication remain separate.
- [x] Phase 20 timing is not presented as an asymptotic performance claim.
- [x] limitations of small controlled corpus are explicit.

## Citation gate

Current automated audit: **20 cited keys / 20 bibliography entries / 0 missing / 0 uncited**.

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

- [x] anonymized generative-AI disclosure is present in the ICST TeX/PDF draft.

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


## Current automated submission status (2026-10-08)

Latest CI paper build on the current manuscript revision:

- submission audit gate: PASS;
- research freeze: PASS;
- citation audit: PASS;
- anonymity text audit: PASS;
- LaTeX build: PASS;
- PDF pages: 5;
- rendered visual inspection: PASS for clipping/overlap/readability;
- PDF preflight: PASS;
- embedded fonts: PASS;
- PDF `/Author` metadata: blank;
- protected research trees changed by paper branch: 0.

Remaining items are submission logistics or human-review tasks: reviewer-facing anonymous artifact hosting, license decision, independent novelty review, final spell/read-through, and the actual conference upload.
