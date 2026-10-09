# ICST 2027 Submission Record

This file is the author-side freeze record for the StateScout ICST 2027 Research Papers submission. Do not place this file in the anonymous reviewer artifact.

## Venue

- Track: ICST 2027 Research Papers
- Submission deadline: 2026-11-02 AoE (UTC-12)
- Review model: double-anonymous
- Format: IEEE conference, US Letter
- Body limit: 10 pages, plus up to 2 reference-only pages

## Submission branch

- Branch: `paper/icst-hostile-reviewer-hardening`
- Frozen research implementation base: `d4aa27d4e2516555a30741f9829785b0db12316e`
- Protected research trees: `src/`, `benchmarks/`, `tests/`

Do not merge or modify the protected research trees merely to prepare the submission.

## Hardened manuscript PDF

The exact manuscript and bibliography used by the strict clean-checkout CI build were unchanged after CI source commit:

`0b2ad8f5a33c5a2a6e874854ea4ab18fa9da654c`

Verified CI run:

- workflow: Paper PDF
- run id: `37881665618`
- artifact id: `11595181085`
- pages: 6
- page size: 612 x 792 pt (US Letter)
- PDF bytes: 157911
- PDF SHA-256: `3bf7676eaef2ea14f32fddcddbca28a2fa443d2fae2ea3bda684ef30f5c84174`
- PDF Author metadata: blank
- rendered identity-leak scan: PASS
- Type 3 font scan: PASS
- source citation audit: 20 cited keys / 20 bibliography entries / 0 missing / 0 uncited
- source anonymity audit: 0 identity leaks

A six-page rendered inspection showed no clipping or overlap and kept the lifecycle figure, result table, and defeasibility figure readable.

Any later change to `paper/icst2027/main.tex` or `paper/references.bib` invalidates this PDF record and requires a new PDF hash/preflight.

## Anonymous replication ZIP

### Final artifact

- filename: `statescout-icst2027-anonymous.zip`
- final SHA-256: **PENDING — record from the locally rebuilt and smoke-tested Phase 21B ZIP**
- final bytes: **PENDING**
- final entry count: **PENDING**
- anonymous reviewer URL / venue attachment: **PENDING**

Fresh-extraction verification of the Phase 21B ZIP already passed locally:

- `npm ci`: PASS
- Playwright Chromium installation: completed
- strict TypeScript check: PASS
- tests: 75/75 PASS
- `src/`: MATCH
- `benchmarks/`: MATCH
- `tests/`: MATCH
- anonymous research snapshot intact: true

### Obsolete archive — do not submit

The earlier uploaded archive is not the final Phase 21B package:

- bytes: 154723
- entries: 147
- SHA-256: `EDA40DEFB35F7A049E68EFFF80B114838EFA444130684CD1A3916CC25CE53843`

It contains a reviewer-facing Phase 19 Markdown record that still points to omitted author-side `docs/REAL_WORLD_REPLICATIONS.md`. Phase 21B intentionally removed that dangling dependency. Do not use this older hash/file for submission.

## AI-use disclosure

The anonymous manuscript contains the current ICST disclosure naming OpenAI ChatGPT, describing the affected prose/software/reporting/documentation/figure-specification material, and stating the extent of assistance and author verification responsibilities.

If the manuscript changes, confirm that the disclosure still accurately describes the final submission.

## Bibliography

- cited keys: 20
- bibliography entries: 20
- missing: 0
- uncited: 0
- external bibliographic verification: completed during Phase 21B
- BrowserGym citation: peer-reviewed TMLR publication

Any later bibliography edit requires rerunning the citation audit and rebuilding the PDF.

## Final submission logistics

Complete only when the exact files are ready for upload:

- [ ] record final anonymous ZIP SHA-256, bytes, and entry count;
- [ ] decide the archival/public artifact license;
- [ ] create anonymous reviewer artifact access or use the venue-provided anonymous supplementary mechanism;
- [ ] record the exact reviewer artifact URL/location;
- [ ] perform final end-to-end human read of the exact PDF;
- [ ] independently challenge the novelty paragraph and APE boundary;
- [ ] verify the exact PDF and ZIP are the files selected for upload;
- [ ] record HotCRP submission ID;
- [ ] record submission timestamp;
- [ ] retain local copies of the submitted PDF and ZIP plus their hashes.

## Submission identifiers

- HotCRP submission ID: **PENDING**
- submission timestamp: **PENDING**
- artifact location/URL: **PENDING**
- chosen artifact license: **PENDING**
