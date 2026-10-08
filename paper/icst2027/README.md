# ICST 2027 Submission Draft

This directory contains the anonymized IEEE-style submission draft for the ICST 2027 Research Papers track.

## Current source

- `main.tex` — compressed submission-oriented manuscript.
- bibliography — `../references.bib`.

The long-form source manuscript remains:

`paper/MANUSCRIPT_V0_1.md`

Do not destructively shorten the long-form manuscript to satisfy the conference page limit. Apply submission-specific compression here.

## Compile locally

With a TeX distribution containing IEEEtran:

```powershell
cd paper\icst2027

pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

Or import `paper/icst2027/main.tex` and `paper/references.bib` into an anonymized Overleaf project using the IEEE conference template.

## ICST 2027 body constraint

The Research Papers track allows:

- 10 pages maximum for text, figures, tables, and appendices;
- 2 additional pages containing only references.

The current TeX file is an initial compressed draft. Its page count must be checked from the compiled PDF; source-line or word counts are not substitutes for the venue page limit.

## Double-anonymous rules

Before submission verify that the PDF and artifact do not reveal:

- author name;
- GitHub username;
- institution;
- personal domain;
- local filesystem usernames;
- PDF metadata that identifies the author.

The current TeX source uses `Anonymous Author(s)`.

## Generative-AI disclosure

ICST 2027 requires disclosure of AI-generated text, figures/images, or code.

The anonymized acknowledgment in `main.tex` is drafted from:

`paper/AI_USE_DISCLOSURE.md`

Recheck the final IEEE/ICST policy immediately before submission and make sure the disclosure still accurately describes the final paper and artifact.

## Pre-submission checks

From the repository root:

```powershell
npm run experiment:phase21
npm run paper:check-citations
npm run paper:build-assets
```

Expected research-freeze result:

```text
src: MATCH
benchmarks: MATCH
tests: MATCH
Research freeze intact: true
```

The citation audit must report no missing bibliography keys.

## Figures

The current TeX draft intentionally starts with the compact result table and text while the final figure placement is tuned to the 10-page limit.

Source paper figures live under:

`paper/figures/`

If raster/PDF exports are made for IEEE submission, preserve their provenance and do not hand-edit quantitative values.

## Primary target

ICST 2027 Research Papers.

Full-paper deadline: 2026-11-02 AoE.

See:

- `paper/VENUE_STRATEGY.md`;
- `paper/ICST_2027_SUBMISSION_CHECKLIST.md`;
- `paper/ICST2027_MANUSCRIPT_PLAN.md`.
