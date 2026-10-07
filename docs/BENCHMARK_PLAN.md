# Minimal Benchmark Plan

## Why build our own first benchmark?

If we immediately crawl a large real application, we may see failures without knowing the correct answer.

A controlled benchmark gives us **ground truth**.

Ground truth means we know exactly:

- how many meaningful states exist;
- which actions connect them;
- which loops exist;
- which states intentionally share a URL;
- which states should be treated as equivalent despite DOM noise.

## Fixture 1 — Basic state graph

One local application should contain:

```text
Home
├── Open menu ----------> Menu Open
│                          └── Close ----> Home
├── Open dialog --------> Dialog Open
│                          ├── Cancel ---> Home
│                          └── Details --> Details
└── About -------------> About
                           └── Home -----> Home
```

Important properties:

- more than two children from Home;
- cycles back to Home;
- multiple states use the same URL;
- two paths can converge;
- safe actions only.

Expected ground truth is written manually before running StateScout.

## Fixture 2 — DOM noise

Create two renderings of the same semantic state where only irrelevant implementation details differ:

- wrapper div inserted;
- CSS class changed;
- generated ID changed;
- interaction order changed where user semantics remain equivalent.

Expected:

```text
same semantic state
```

This tests false splitting.

## Fixture 3 — Meaningful same-route change

Use one route where:

- dialog closed;
- dialog open;
- selected tab changes.

Expected:

```text
different semantic states
```

This tests false merging.

## Fixture 4 — Safety

Controls:

```text
Open settings
Create record
Delete record
Pay now
Continue
```

The "Continue" control should lead to a deliberately tricky context later, demonstrating why text-only risk classification is insufficient.

## Research discipline

For every fixture:

1. define expected states and transitions first;
2. commit the ground truth;
3. run algorithms afterward;
4. do not change ground truth to make StateScout appear better.

This prevents benchmark design from becoming unconsciously biased toward our algorithm.


## Phase 8 broader generalization

The benchmark program now adds a second controlled browser-equivalence suite with ten frozen pairs. It deliberately includes both known wins and known risks so a newer algorithm cannot be judged only on cases it was designed to solve.

Phase 8 also adds read-only observations of public demo/testing sites. Those live observations are kept separate from manual ground truth because external content and availability can change independently of StateScout.

Research rule:

- controlled fixtures measure correctness;
- live-site observations measure stability/generalization signals;
- live-site observations must never silently become ground truth.


## Phase 9 observed volatility

Volatility learning must use a train/holdout split.

Rules are learned only from trusted repeated observations whose protected semantic anchor is unchanged. Evaluation then uses unseen volatile values and separate meaningful-state anchors to test both generalization and leakage.

A learned rule is scoped to the anchor on which it was learned. Global "this field format is always noise" rules are explicitly rejected as the default research direction.

The benchmark must include a meaningful state with the same superficial changing-value pattern so that a volatility rule cannot pass merely by deleting all dynamic text.


## Phase 10 candidate promotion

Automatic discovery and automatic trust are different problems.

A field may be discovered as a volatility candidate when repeated observations share the same protected semantic anchor while the field varies. That candidate remains quarantined and cannot affect state identity.

Promotion requires independent evidence:

- multiple observation sessions;
- enough distinct values;
- repeated safe behavioral probes;
- identical downstream behavior signatures.

If behavior diverges, the candidate must remain quarantined even when its immediate snapshots differ only in the candidate field.

This phase deliberately includes a Dashboard candidate that should promote and an Auction countdown candidate that should not.


## Phase 11 explorer evidence persistence

Evidence collection must not change the identity function of the crawl that produced the evidence.

Research rules:

- freeze the fingerprinter at run start;
- collect evidence only as an observation sidecar;
- sidecar failures must not alter graph execution;
- persist evidence under explicit run/session IDs;
- make store merging idempotent so replaying an import cannot inflate confidence;
- discover candidates from persisted evidence only as quarantined candidates;
- defer promotion until after the run and require a future run to start with any newly trusted profile.

The controlled benchmark compares the exact graph signature with and without evidence collection and then merges two independently labeled evidence stores.


## Phase 12 offline between-run promotion

Promotion must happen after a crawl has ended and before a future crawl begins.

Research rules:

- observation evidence and behavior evidence are persisted separately;
- offline promotion consumes only persisted evidence;
- the frozen profile artifact records evidence digests and promotion decisions;
- a profile artifact never mutates a graph that already exists;
- the future explorer receives the profile before its first observation;
- pre-promotion and post-promotion explorer metrics are both frozen before measurement.

The controlled benchmark requires the future empty-profile run to retain volatile-state inflation while the future promoted-profile run collapses only the verified Dashboard volatility.


## Phase 13 trusted-profile revalidation

Trusted abstraction rules must be defeasible when later application behavior contradicts them.

Research rules:

- revalidation happens offline between runs;
- later behavior evidence identifies both the exact field and semantic anchor;
- insufficient evidence cannot revoke a rule;
- sufficiently replicated divergent safe-probe behavior can revoke a rule;
- every revision records the parent-profile digest and challenge-evidence digest;
- a revoked rule disappears only from a future profile, never from the identity function of a crawl already in progress;
- benchmark both stable later evidence and semantic drift so the mechanism is not biased toward revocation.

The controlled evolved-app benchmark requires stale trust to lose meaningful-state coverage and offline revocation to restore that coverage on the next crawl.


## Phase 14 freshness-aware trust lifecycle

Trusted rules are no longer modeled as permanently trusted or permanently revoked.

Research rules:

- trust is materialized only for future runs;
- one sufficiently supported contradictory window immediately challenges a rule and removes it from the next active profile;
- a second distinct contradictory window is required for permanent revocation;
- re-importing the same window cannot increment conflict counters;
- a transient challenge can be cleared by a later stable window;
- a revoked rule requires two distinct stable recovery windows before restoration;
- stale evidence cannot mutate lifecycle state;
- stale trust is excluded from the active profile;
- evidence and trust are scoped to an explicit application/version identifier;
- wrong-scope evidence cannot challenge or restore a rule;
- every lifecycle artifact records its immediate parent digest and the evaluated evidence-window digest.

The controlled benchmark freezes a complete trusted -> challenged -> trusted -> challenged -> revoked -> cooldown -> trusted cycle and verifies that the challenged state already restores conservative full coverage before permanent revocation.


## Phase 15 multi-rule selective revalidation

A real profile may contain many independent trusted or challenged rules, so revalidation must be budgeted rather than exhaustive.

Research rules:

- lifecycle entries remain independent;
- revalidation priority is deterministic and explainable;
- priority considers current lifecycle state, freshness, conflict history, and an explicit estimated coverage impact;
- missing impact metadata is an error rather than an implicit low-risk default;
- a fixed budget selects only the highest-ranked rules;
- evidence for one selected rule must not change unrelated lifecycle entries;
- the priority heuristic is treated as a candidate policy, not an optimal scheduler.

The frozen benchmark contains four rules with expected scores 150, 84, 80, and 11. A budget of two must select the challenged high-impact rule and the aging trusted rule while skipping the cooldown and fresh low-impact rules for that cycle.


## Phase 16 reversible raw observations

Semantic abstraction must not permanently destroy the historical evidence it compresses.

Research rules:

- raw semantic observations are immutable historical evidence;
- raw transitions reference raw observation IDs, not projected state IDs;
- strict raw fingerprints are provenance, not the active abstraction policy;
- projected state aliases are derived views over the archive;
- projected transitions preserve every raw transition ID they represent;
- changing the active fingerprinter/profile may change aliases but must never mutate the raw archive;
- revocation must be able to recover previously aliased historical distinctions without a new browser crawl;
- restoring the previous profile must reproduce the previous projection.

The frozen benchmark stores six observations and seven transitions. A trusted title rule projects them to three states and six transitions. Removing that rule must recover six states and seven transitions from the same archive while leaving the archive digest unchanged.


## Phase 17 broader frozen corpus

Generalization must be challenged on a broader controlled corpus before further identity tuning.

Research rules:

- freeze all semantic labels before evaluator implementation;
- use multiple fixture families rather than one page pattern;
- include both equivalence and distinction cases;
- retain known difficult temporal cases;
- deliberately include meaningful user-visible content not represented by the current observer;
- do not change the observer or fingerprint during this phase to repair corpus failures;
- report both aggregate and per-family false merges/false splits;
- keep browser observation separate from fingerprinter evaluation so Phase 18 can reuse the same observed corpus for baselines and ablations.

The frozen corpus contains 16 pairs across 7 families. The current v4-empty-profile hypothesis is 14/16 correct with two false merges in the content-coverage family and zero false splits.


## Phase 18 baselines and ablations

Comparisons must use the exact frozen Phase 17 corpus and one browser observation set per run.

Research rules:

- compare URL-only and historical semantic fingerprints on identical observations;
- freeze aggregate metrics and exact failure IDs before implementing the comparison evaluator;
- remove individual semantic feature groups to measure contribution rather than only comparing final versions;
- report false merges and false splits separately;
- treat false merges as especially important because they can hide reachable state-space branches;
- keep targeted visible-content augmentation experimental and outside the production observer;
- do not define fingerprint v5 merely because the controlled corpus can be made perfect;
- preserve per-family and per-case outcomes for later paper tables and threats-to-validity analysis.

The frozen study compares nine strategies: URL-only, v1, v2, v3, v4, v4 without controls, v4 without title, v4 without query, and v4 with targeted visible status/list content.


## Phase 19 real-world repeated-run evaluation

Public applications are observational evidence, not controlled ground truth.

Research rules:

- freeze the target list and run protocol before collecting results;
- use fresh browser contexts for repeated runs;
- use only the default safe-only action policy;
- bound attempted transitions;
- separate external unavailability from StateScout run errors;
- keep interaction-level failures inside the graph;
- require at least two successful runs before making a target-level stability statement;
- measure initial fingerprint stability separately from graph-structure stability;
- do not require public applications to produce a predetermined state count;
- normal unit/browser tests must remain network-independent;
- require at least two evaluable public targets before accepting the phase.

The frozen target set contains TodoMVC React, The Internet Dynamic Controls, and UI Testing Playground Visibility, each measured across three fresh-browser runs.
