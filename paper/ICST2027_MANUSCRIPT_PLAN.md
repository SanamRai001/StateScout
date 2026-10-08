# ICST 2027 Manuscript Compression Plan

## Constraint

ICST 2027 Research Papers use the IEEE two-column conference format and allow:

- 10 pages including text, figures, tables, and appendices;
- 2 additional pages containing references only.

The current `paper/MANUSCRIPT_V0_1.md` is the long-form source manuscript. It should not be cut destructively.

Create the ICST submission from the long form.

## Central thesis to preserve

> StateScout treats learned web-UI state abstraction as an explicit cross-run trust hypothesis: identity is frozen within a run, candidate abstraction is promoted only from scoped evidence between runs, trust can later be challenged/revoked/restored, maintenance can be budgeted, and historical evidence is preserved under later trust changes.

Do not dilute the paper into a general crawler description.

## Claims to foreground

1. URL-only and simplistic normalization fail differently on frozen counterexamples.
2. Contextual scoped evidence resolves the measured volatility ambiguity.
3. Stale abstraction can hide reachable state; revocation restores coverage.
4. Cross-run trust lifecycle makes learned abstraction defeasible.
5. Preserved raw history lets trust changes reinterpret recorded evidence.
6. Controlled checkpoint/resume and public-site replication support the artifact's operational credibility.

## Claims to demote

Move these to short supporting paragraphs or artifact material:

- exact internal TypeScript module organization;
- every phase chronology;
- all fingerprint implementation details;
- all lifecycle status edge cases;
- exact evidence-store serialization mechanics;
- all Phase 20 raw timing values;
- long discussion of possible future browser checkpoint optimizations.

## Candidate 10-page layout

### Page 1 — Abstract + Introduction

Keep:

- problem;
- false split vs false merge asymmetry;
- one-paragraph prior-art boundary;
- cross-run lifecycle thesis;
- four contributions, not five.

Recommended contributions:

1. run-frozen evidence-backed cross-run trust lifecycle;
2. defeasible challenge/revocation/restoration + selective maintenance;
3. preserved historical evidence under trust changes;
4. frozen/reproducible evaluation artifact.

Fold checkpoint/safety into contribution 4.

### Page 2 — Background + Related Work

Use one compact section rather than separate long background/related-work chapters.

Must include:

- Crawljax / Roest;
- APE;
- FragGen;
- WebEmbed;
- Judge;
- one sentence on modern accessibility-oriented browser observations.

The key contrast paragraph should explicitly say:

> APE already demonstrates online abstraction refinement/coarsening and model rebuilding. StateScout instead studies an explicit cross-run rule-trust lifecycle in which one run's identity is frozen and later evidence changes future-run trust.

### Pages 3-4 — Design

Use Figure 1 as the anchor.

Cover:

- semantic snapshot/fingerprint;
- run-frozen identity;
- protected anchor;
- candidate quarantine;
- behavior-backed delayed promotion;
- trust lifecycle;
- preserved raw archive/projection.

Compress:

- BFS/replay/safety/checkpoint to one supporting subsection.

### Page 5 — Methodology

Use one compact protocol table.

Rows:

- Phase 18 pairwise baselines/ablations;
- Phase 9 contextual volatility;
- Phases 13-16 lifecycle/reversibility;
- Phase 19 real-world repeated runs;
- Phase 20 recovery.

Define FM/FS once.

State environment and freeze baseline in one paragraph.

### Pages 6-8 — Results

#### RQ1

Use Figure 2 + Table 1 or Figure 2 alone if space is tight.

Main numbers:

- URL-only 5/16, FM10/FS1;
- v4 14/16, FM2/FS0;
- no-controls 9/16;
- targeted content 16/16 as diagnostic only.

#### RQ2

Short result:

- trusted scoped v4 6/6;
- earlier global normalization false merges.

#### RQ3

Use Figure 3 and Figure 4.

Main numbers:

- stale coverage 0.5 -> revoked 1.0;
- raw 6 observations;
- projections 3 -> 6 -> 3;
- raw digest unchanged.

Mention APE distinction in interpretation, not result.

#### RQ4

One compact paragraph/table row:

- 4 rules;
- budget 2;
- selected 2;
- unrelated states preserved;
- heuristic not claimed optimal.

#### RQ5

One compact table:

- Phase 19 3/5 evaluable, zero run errors;
- later replication changes stability;
- Phase 20 interrupted/resumed graphs equal uninterrupted;
- 496 structural replay observations.

### Page 9 — Discussion + Threats

Discussion priorities:

- abstraction is a trust-management problem;
- observer completeness vs abstraction correctness;
- cross-run delay is deliberate for reproducibility;
- preserved history != retroactive exploration completeness;
- temporal variability in public apps.

Threats:

- researcher-designed/small controlled corpus;
- no head-to-head Judge/FragGen/WebEmbed reproduction;
- APE overlap narrows novelty;
- limited real-world sample;
- safe-only policy constrains action space;
- single-machine timing.

### Page 10 — Artifact + Conclusion

Artifact:

- frozen commit;
- 75/75 tests;
- tree-hash verifier;
- controlled reproduction command;
- real-world rerun separate;
- asset hash provenance.

Conclusion: one short paragraph.

## Figure selection under page pressure

Priority order:

1. Figure 1 lifecycle;
2. Figure 2 Phase 18 comparison;
3. combine Phase 13 + Phase 16 into one two-panel figure if necessary;
4. remove standalone Phase 20 figure; use compact table/text.

## Table selection under page pressure

Prefer:

- one protocol table;
- one compact main-results table.

Do not include all four Markdown source tables verbatim in the submission.

## Expected cuts from long manuscript

Likely remove 35-50% of current prose.

Do not cut by deleting limitations or prior-art discussion first. Cut:

1. implementation narration;
2. repeated explanations of the same mechanism;
3. phase chronology;
4. exhaustive status lists;
5. secondary measurements;
6. future-work enumerations.

## Submission-specific files to create next

- `paper/icst2027/main.tex`;
- `paper/icst2027/references.bib` or reuse/link the audited bibliography;
- IEEE-compatible figure exports;
- anonymized artifact README;
- anonymized AI-use acknowledgment;
- final 10-page PDF.

Do not create author-identifying metadata in the double-anonymous draft.
