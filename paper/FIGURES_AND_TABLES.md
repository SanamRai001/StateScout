# Paper Figures and Tables

## Build command

After the controlled experiment outputs exist under `results/raw/`, generate the paper assets with:

```powershell
npm run paper:build-assets
```

The generator reads:

- `results/raw/phase-13-profile-revalidation.json`;
- `results/raw/phase-16-reversible-equivalence.json`;
- `results/raw/phase-18-baselines-ablations.json`;
- `results/raw/phase-20-scalability-recovery.json`.

It writes SVG/Markdown/CSV assets and `paper/assets-manifest.json`, which records SHA-256 hashes for every source JSON file and generated output.

The generated asset files are derived reporting artifacts. They must not be hand-edited.

---

## Figure 1 — StateScout abstraction lifecycle

**Purpose:** conceptual overview of the paper's central contribution.

**Content:**

```text
observation
   ↓
candidate quarantine
   ↓
cross-session evidence
   ↓
safe-probe behavior evidence
   ↓
offline promotion
   ↓
trusted rule
   ↓
freshness / revalidation
   ├─ stable → trusted
   └─ conflict → challenged → revoked → cooldown → restored

immutable raw archive
   ↓
current equivalence projection
```

**Paper use:** Introduction / System Design.

**Status:** conceptual figure; should be rendered after the visual style of the final paper template is selected.

This is intentionally not a quantitative result figure.

---

## Figure 2 — Phase 18 state-abstraction comparison

**Generated file:**

`paper/figures/fig-phase18-ablation.svg`

**Source:**

`results/raw/phase-18-baselines-ablations.json`

**Caption draft:**

> **Figure 2. Controlled Phase 18 comparison across nine state-identity strategies.** Bars show correctly classified state pairs out of 16; labels also report false merges (FM) and false splits (FS). URL-only identity produces 10 false merges, while the frozen v4 semantic identity reaches 14/16 with two false merges. Removing semantic controls drops performance to 9/16. The targeted-content condition is an evaluation-only observer augmentation, not the frozen production observer.

**Primary claim supported:**

- URL-only is insufficient on the frozen corpus;
- semantic control state materially contributes to identity;
- observer coverage explains the remaining v4 misses.

---

## Figure 3 — Phase 13 revocation restores controlled coverage

**Generated file:**

`paper/figures/fig-phase13-revocation.svg`

**Source:**

`results/raw/phase-13-profile-revalidation.json`

**Caption draft:**

> **Figure 3. Effect of stale versus revoked abstraction after behavior drift.** Keeping the stale trusted rule collapses meaningful evolved states and yields 0.5 controlled coverage. Offline revocation removes the stale abstraction and restores full meaningful-details coverage.

**Primary claim supported:**

- learned abstraction must be defeasible;
- stale trust can hide reachable semantic state.

---

## Figure 4 — Phase 16 reversible reprojection

**Generated file:**

`paper/figures/fig-phase16-reprojection.svg`

**Source:**

`results/raw/phase-16-reversible-equivalence.json`

**Caption draft:**

> **Figure 4. Reversible projection over one immutable raw archive.** Six raw observations project to three states under trusted abstraction, six states after revocation, and three states again after trust restoration. The raw archive digest remains unchanged across all projections.

**Primary claim supported:**

- abstraction can change without rewriting historical evidence;
- revocation can reveal distinctions hidden by a previous trusted projection.

---

## Figure 5 — Deep replay and checkpoint recovery

Phase 20 should be presented primarily as a schematic plus a compact result table rather than a timing curve.

Reason:

The synthetic single-run timings are non-monotonic because of startup/JIT/GC noise and are not suitable for an empirical complexity fit.

Recommended schematic:

```text
Depth 0 → 1 → 2 → ... → 32

Replay observations:
0 + 1 + 2 + ... + 31 = 496

uninterrupted:
0 ------------------------------ 32

checkpointed:
0 -------- 10 | checkpoint | ---- 32

final controlled graph signatures equal
```

**Paper use:** Robustness / scalability discussion.

The exact timing values can remain in Table 2 and the artifact, not in a performance-trend figure.

---

## Table 1 — Phase 18 baselines and ablations

**Generated files:**

- `paper/tables/table-phase18-ablation.md`;
- `paper/tables/table-phase18-ablation.csv`.

**Source:**

`results/raw/phase-18-baselines-ablations.json`

**Columns:**

- strategy;
- correct pairs;
- accuracy;
- false merges;
- false splits.

**Paper use:** Main RQ1 result table.

---

## Table 2 — Phase 20 scale and recovery

**Generated file:**

`paper/tables/table-phase20-recovery.md`

**Source:**

`results/raw/phase-20-scalability-recovery.json`

**Contains:**

- 64/128/256-state synthetic results;
- injected-failure counts;
- observed runtime/heap values;
- synthetic checkpoint equivalence;
- browser deep-replay observation count;
- browser checkpoint equivalence.

**Paper use:** RQ5 robustness result.

---

## Table 3 — Abstraction lifecycle experiments

Recommended manuscript table, assembled from the verified controlled experiments:

| Phase | Question | Key frozen result |
| --- | --- | --- |
| 9 | Can scoped evidence resolve syntax ambiguity? | v4 trusted profile: 6/6, FM=0, FS=0 |
| 10 | Can divergent behavior block promotion? | Dashboard eligible; Auction ineligible |
| 13 | Can stale trust be revoked? | coverage 0.5 → 1.0 |
| 14 | Can trust be challenged/restored over windows? | challenge, revoke, cooldown, restore all reproduced |
| 15 | Can revalidation be budgeted? | 2/4 rules selected; unselected states preserved |
| 16 | Can historical abstraction be reversed? | projection 3 → 6 → 3, raw digest unchanged |

This table is a narrative synthesis of separately verified frozen experiments rather than one generated experiment output.

The manuscript should cite each underlying phase/result rather than imply a single combined statistical test.

---

## Table 4 — Real-world original result and temporal replication

Use the recorded values from `docs/REAL_WORLD_REPLICATIONS.md`.

The original accepted Phase 19 study and the later replication must be shown as separate observations.

Suggested columns:

- target;
- original successful runs;
- original initial stability;
- original graph stability;
- later initial stability;
- later graph stability.

Do not replace the original result with the cleaner later TodoMVC replication.

---

## Asset provenance

The asset builder creates:

`paper/assets-manifest.json`

For each quantitative input it records:

- file path;
- SHA-256 digest.

For each generated output it records:

- path;
- SHA-256 digest;
- byte count.

This allows a reviewer to verify that a paper figure was regenerated from the same raw experiment file.

## Freeze boundary

Paper asset generation must not modify:

- `src/`;
- `benchmarks/`;
- `tests/`.

Figures, tables, prose, and reporting scripts remain outside the protected Phase 21 research trees.
