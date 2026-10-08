# Table 3 — Abstraction Lifecycle Experiments

This table synthesizes separately verified frozen experiments. It does not represent one combined statistical test.

| Phase | Research question | Frozen result |
| --- | --- | --- |
| 9 | Can scoped evidence resolve a syntax ambiguity that global normalization cannot? | v4 + trusted scoped profile: 6/6 correct, FM=0, FS=0 |
| 10 | Can behavior evidence prevent unsafe promotion? | Dashboard candidate eligible; Auction candidate ineligible because downstream behavior diverged |
| 13 | Can stale trusted abstraction be revoked after behavior drift? | controlled meaningful-details coverage 0.5 with stale trust → 1.0 after revocation |
| 14 | Can rule trust evolve across later evidence windows? | retained, challenged, challenge-cleared, revoked, cooldown, restored, stale-evidence and scope-mismatch outcomes reproduced |
| 15 | Can rule maintenance be bounded? | budget 2 selected 2/4 rules; unrelated lifecycle entries preserved |
| 16 | Can historical abstraction be reversed without rewriting evidence? | same raw archive projected to 3 → 6 → 3 states; raw archive digest unchanged |

## Source provenance

- Phase 9: `docs/PROJECT_STATE.md` and the Phase 9 experiment.
- Phase 10: `docs/PROJECT_STATE.md` and the Phase 10 experiment.
- Phase 13: `results/raw/phase-13-profile-revalidation.json` when reproduced.
- Phase 14: `docs/PROJECT_STATE.md` and the Phase 14 experiment.
- Phase 15: `docs/PROJECT_STATE.md` and the Phase 15 experiment.
- Phase 16: `results/raw/phase-16-reversible-equivalence.json` when reproduced.

The paper should cite the individual experiments when discussing each row.
