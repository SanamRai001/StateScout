# Project State

## Goal

Build StateScout as both:

1. a practical semantic web-application state explorer; and
2. a reproducible software-testing research artifact.

## Current phase

**Phase 3 — Evidence-driven fingerprint v2 comparison**

## Branch

`feat/phase-3-fingerprint-v2`

## Phase 0 status

Merged to `main` through PR #1.

Phase 0 established:

- project vision;
- research questions and hypotheses;
- experiment families;
- initial related-work map;
- reproducibility requirements;
- graph-not-tree direction;
- deterministic-core-before-AI direction.

## Changes in Phase 1A

### Core TypeScript model

Added:

- `StateNode`
- `SemanticStateSnapshot`
- `StateFingerprint`
- `Interaction`
- `Transition`
- `StatePath`
- replay steps
- locator candidates
- action-risk types

### Semantic fingerprint v1

Added deterministic canonicalization and SHA-256 fingerprinting based on:

- origin/path/query;
- title;
- headings;
- landmarks;
- dialogs;
- semantic controls;
- selected/expanded/checked/disabled control state.

The implementation intentionally remains a research candidate rather than a finalized algorithm.

### In-memory graph

Added a directed state graph with:

- semantic-state deduplication by fingerprint;
- state lookup;
- observed transition storage;
- convergent edges (multiple parents can reach one state);
- invariant checks for unknown source/destination states.

### BFS frontier

Added an exploration frontier that:

- behaves FIFO;
- stores state + interaction work;
- deduplicates `(fromState, interaction)` pairs independently from state deduplication.

This separation is intentional because "have I seen this state?" and "have I tried this action from this state?" are different questions.

### Policy v1

Added:

- same-origin crawl boundary;
- safe/mutating/destructive/unknown risk classes;
- conservative default execution policy;
- deterministic keyword-based initial risk classifier.

### Controlled benchmark

Added `benchmarks/basic-state-graph` with:

- five manually defined meaningful UI states;
- cycles back to Home;
- multiple states on the same URL;
- convergent paths to Details;
- explicit ground-truth transitions.

Ground truth exists before Playwright exploration so future coverage measurements have a known target.

### Tests

Added lightweight unit coverage for:

- semantically equivalent reordered states;
- same-route dialog state differences;
- query-order normalization;
- same-origin boundary;
- external/non-HTTP blocking;
- risk classification;
- conservative default execution policy;
- graph state deduplication;
- distinct same-route states;
- convergent graph transitions;
- FIFO frontier behavior;
- frontier work-item deduplication.

### Learning documentation

Added `docs/CONCEPTS.md`.

Key learning checkpoints:

- page vs state;
- graph vs tree;
- state vs snapshot vs fingerprint;
- false merge vs false split;
- interaction identity vs DOM identity;
- state deduplication vs work deduplication;
- frontier;
- state restoration;
- safety limitations;
- research mindset.

### Architecture and benchmark design

Added:

- `docs/ARCHITECTURE.md`;
- `docs/BENCHMARK_PLAN.md`.

Current decisions:

- BFS first;
- frontier stores state/action work, not URLs;
- replay paths verify intermediate fingerprints;
- Playwright will be an adapter around a browser-independent core;
- no database yet;
- controlled benchmark ground truth must be written before evaluation.

## Dependency baseline

- Node: >=24
- TypeScript: 7.0.2
- Node type definitions: ^24.19.1

Playwright is now added only at the browser-adapter boundary; the core remains browser-independent.

## Verification status

Phase 1A was reported locally working by the user and merged to `main` through PR #2 at `a7cb0f31`.

Phase 1B implementation is complete in code and now adds:

- a Playwright adapter that converts live browser state into `SemanticStateSnapshot`;
- visible button/link discovery with deterministic interaction IDs;
- semantic locator execution;
- reuse of the core conservative action-risk policy;
- replay-based state restoration with intermediate fingerprint verification;
- BFS execution over `(state, interaction)` work items;
- state/transition insertion into the browser-independent `StateGraph`;
- explicit blocked/failed/no-state-change transition handling;
- controlled benchmark evaluation against fixed ground truth;
- an end-to-end browser test expecting all 5 benchmark states and all 9 benchmark transitions.

Whole-phase runtime verification was completed successfully by the user on Node v24.19.0 after the final strict-TypeScript and accessible-dialog assertion fixes.

Verified commands:

```powershell
npm run typecheck
npm test
```

Result: Phase 1B verification gate passed.

Required verification:

```powershell
git fetch origin
git switch feat/phase-1b-playwright-observation
git pull --ff-only
npm install
npx playwright install chromium
npm run typecheck
npm test
```

Expected behavior: all existing core tests remain green and the new browser adapter test passes.

## Risks and open questions

### State equivalence

Fingerprint v1 can still:

- falsely merge distinct states;
- falsely split equivalent dynamic states;
- over-weight low-value text/control details;
- miss visual-only state.

These are expected research questions, not hidden defects.

### Safety classifier

Keyword-only classification is insufficient for production autonomy.

Examples:

- "Continue" can trigger a payment;
- "Remove filters" is harmless despite the word "remove".

Unknown actions remain blocked by default.

### Replay

Path replay may become expensive for deep workflows and may fail when data/session state changes.

### Query parameters

Current fingerprint includes normalized query values. Later experiments must determine which query parameters are semantic versus noisy.

### Benchmark bias

Synthetic fixtures can accidentally favor the algorithm being designed. Ground truth must remain fixed unless a benchmark defect is independently justified.

## Acceptance criteria for Phase 1A

Completed in code/design:

- core schemas are defined;
- fingerprint candidate is deterministic by design;
- same-origin and action policies exist;
- state restoration strategy is documented;
- minimal benchmark graph and ground truth are implemented;
- graph/frontier logic exists independently of Playwright;
- concepts are documented without requiring implementation reading.

Pending:

- local `typecheck`;
- local unit-test pass.

## Learning priority

Understanding takes priority over publishing speed.

Before Phase 1B, be able to explain:

1. why URL identity is insufficient;
2. why a graph is required instead of a binary tree;
3. what information a fingerprint intentionally discards;
4. the difference between a false merge and a false split;
5. the difference between state deduplication and frontier/work deduplication;
6. why the frontier contains state/action pairs rather than URLs;
7. why a deterministic benchmark needs ground truth written before evaluation.

## Phase 2 implementation

Phase 2 is complete in code and intentionally measures fingerprint v1 before changing it.

Added:

- a frozen nine-pair semantic-equivalence benchmark;
- explicit same/different ground-truth labels and rationales;
- precision/recall/F1-style equivalence metrics;
- false-merge and false-split counts/rates;
- fingerprint pair timing;
- a machine-readable JSON experiment runner;
- reusable replay verification;
- browser coverage ensuring every discovered benchmark state can be restored by replay.

The frozen baseline predicts two known false splits in fingerprint v1: tracking-query noise and volatile timestamp title noise. Those limitations remain visible rather than being tuned away during the same experiment.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-2-state-equivalence
git pull --ff-only
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run experiment:equivalence
```

The experiment command writes `results/raw/phase-2-state-equivalence.json`.

Expected deterministic classification baseline:

- 9 labeled pairs;
- 7 correct;
- 0 false merges;
- 2 false splits;
- false-split cases: `tracking-query-noise` and `timestamp-title-noise`.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 17/17 passed, 0 failed;
- equivalence experiment: 9 labeled pairs, 7 correct;
- accuracy: 0.7777777777777778;
- same-state precision: 1.0;
- same-state recall: 0.6;
- same-state F1: 0.75;
- false merges: 0/4 (0%);
- false splits: 2/5 (40%);
- observed false splits: `tracking-query-noise`, `timestamp-title-noise`;
- replay robustness test restored every discovered controlled-benchmark state;
- experiment output was successfully written to `results/raw/phase-2-state-equivalence.json`.

Phase 2 verification gate is complete.

## Phase 3 implementation

Phase 3 is complete in code and keeps fingerprint v1 unchanged as the experimental baseline.

Fingerprint v2 makes only two evidence-driven changes:

1. ignores a fixed allowlist of known tracking query keys;
2. normalizes clock-time tokens in the page title.

It intentionally does not remove arbitrary numbers/timestamps from headings or controls because those values may represent meaningful application state.

The comparison layer evaluates v1 and v2 against the exact frozen Phase 2 labels. Additional guard tests ensure v2 still distinguishes ordinary query changes and meaningful numeric control names.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-3-fingerprint-v2
git pull --ff-only
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run experiment:equivalence
npm run experiment:fingerprint-comparison
```

Expected comparison hypothesis:

- v1 remains 7/9 with 0 false merges and 2 false splits;
- v2 reaches 9/9 on the frozen benchmark;
- v2 introduces 0 false merges;
- false splits decrease by 2;
- non-tracking query changes and meaningful numeric controls remain distinct.

Do not promote v2 as the explorer default during this phase. The comparison must pass first.

## Next phase after verification

If Phase 3 confirms the hypothesis, the next phase can evaluate v2 as an explorer state-identity strategy on broader/noisier browser fixtures before considering promotion to the default.

## Merge status

Phases 1A, 1B, and 2 are merged. Phase 3 implementation is complete on `feat/phase-3-fingerprint-v2` and awaits its single whole-phase verification gate.
