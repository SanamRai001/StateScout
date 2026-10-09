# ICST 2027 Submission Checklist

## Deadline

Full paper: **2026-11-02 AoE**.

## Format gate

Strict clean-checkout verification on 2026-10-09 (hardened paper CI source `0b2ad8f5a33c5a2a6e874854ea4ab18fa9da654c`):

- [x] IEEE two-column conference template compiles in CI.
- [x] Current draft is 6 total US-Letter pages, safely below the 10-body + 2-reference venue ceiling.
- [x] double-anonymous manuscript header.
- [x] PDF `/Author` metadata is blank.
- [x] rendered PDF contains no known author name/handle/domain/local-path leak.
- [x] Type 3 font scan passes.
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

Manual bibliography verification completed during Phase 21B for all 20 cited records using publisher/proceedings, DOI, DBLP, OpenReview/PMLR, or equivalent primary/curated sources. The pass checked existence, core bibliographic metadata, and whether each source supports the role for which it is cited.

One upgrade was made: BrowserGym now cites its peer-reviewed 2025 Transactions on Machine Learning Research publication instead of only the earlier arXiv record.

The citation-key audit was rerun after this bibliography update in clean hosted CI and remained 20/20 with no missing or uncited entries.

## Reproduction gate

Fast reviewer-shaped artifact gate from a fresh extraction:

```powershell
npm ci
npx playwright install chromium
npm run artifact:smoke
```

This gate passed locally with 75/75 tests and all anonymous protected-content digests matching. The complete controlled reproduction remains available through `npm run research:reproduce-controlled`; do not require the external Phase 19 rerun for deterministic artifact reproducibility.

## Artifact gate

Fresh-extraction verification of the current anonymous ZIP passed locally after Phase 21B hardening:

- [x] anonymized reviewer archive generated and extracted successfully.
- [x] README quick start.
- [x] exact Node reference version.
- [x] Chromium install step.
- [x] expected command outputs.
- [x] protected-source content-digest identities.
- [x] raw controlled JSON outputs.
- [x] self-contained recorded Phase 19 original/replication evidence.
- [x] fresh extraction: `npm ci` passed with 0 reported vulnerabilities.
- [x] fresh extraction: strict typecheck passed.
- [x] fresh extraction: 75/75 tests passed, 0 failed.
- [x] fresh extraction: `src/`, `benchmarks/`, and `tests/` all MATCH.
- [x] fresh extraction: `Anonymous research snapshot intact: true`.
- [ ] record SHA-256 of the final ZIP after all packaging-text changes are frozen.
- [ ] anonymous reviewer hosting/venue supplementary upload.
- [ ] license decision for archival/public release.
- [ ] archival DOI if practical.

The anonymous archive intentionally uses protected content digests instead of author-owned Git commit/tree identifiers.

## AI-use disclosure gate

- [x] anonymized generative-AI disclosure is present in the ICST TeX/PDF draft.

ICST 2027 requires disclosure of AI-generated text, figures/images, or code.

Prepare an anonymized acknowledgment such as:

> Generative AI tools were used during development and manuscript preparation for interactive coding assistance, language drafting/editing, and generation/refinement of reporting scripts and figure specifications. All research claims, experimental designs, benchmark labels, source code changes, references, numerical results, and final manuscript content were reviewed and verified by the author. The frozen research artifact and raw experiment outputs are provided for independent verification.

This wording must be adjusted to accurately reflect the final submission and IEEE/ICST policy at submission time.

## Final manuscript rebuild gate

The exact hardened manuscript was rebuilt in clean hosted CI on 2026-10-09.

- [x] 6 total pages, below the 10-page body ceiling.
- [x] no reference-only overflow is needed.
- [x] PDF `/Author` metadata is blank.
- [x] rendered text contains no known author name, handle, domain, or local path.
- [x] no Type 3 fonts.
- [x] rendered six-page inspection shows no clipping or overlap; figures and tables remain readable.

Exact CI-produced PDF SHA-256: `3bf7676eaef2ea14f32fddcddbca28a2fa443d2fae2ea3bda684ef30f5c84174` (157911 bytes).

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


## Current automated submission status (2026-10-09)

Latest strict clean-checkout paper build on the hardened manuscript:

- `npm ci`: PASS;
- submission audit gate: PASS;
- research freeze: PASS;
- frozen verified suite recorded: 75/75;
- citation audit: PASS (20/20; no missing/uncited entries);
- anonymity text audit: PASS;
- LaTeX build: PASS;
- PDF pages: 6;
- rendered visual inspection: PASS for clipping/overlap/readability;
- compiled-PDF identity scan: PASS;
- Type 3 font scan: PASS;
- PDF `/Author` metadata: blank;
- protected research trees changed by paper branch: 0.

Remaining items are submission logistics or human-review tasks: reviewer-facing anonymous artifact hosting, license decision, independent novelty review, final spell/read-through, and the actual conference upload.
