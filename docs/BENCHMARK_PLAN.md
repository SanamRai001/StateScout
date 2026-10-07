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
