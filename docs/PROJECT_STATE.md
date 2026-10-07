# Project State

## Goal

Build StateScout as both:

1. a practical semantic web-application state explorer; and
2. a reproducible software-testing research artifact.

## Current phase

**Phase 1A — Deterministic exploration kernel design**

## Branch

`feat/phase-1a-domain-model`

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

Playwright has intentionally not been added yet.

## Verification status

Repository history, Phase 0 documents, branch diff, and implementation structure were reviewed during Phase 1A.

An attempted isolated runtime check could not clone GitHub because the execution environment had no DNS access to GitHub. That environment also exposes Node 22 while this project intentionally targets Node >=24.

Therefore runtime verification remains pending on the user's Node 24+ checkout.

Required verification:

```powershell
npm install
npm run typecheck
npm test
```

Do not mark Phase 1A verified or merge it until these commands pass.

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

## Next phase after verification

**Phase 1B — Playwright observation adapter**

Initial scope only:

1. launch benchmark page;
2. capture a `SemanticStateSnapshot` from the live DOM/accessibility semantics;
3. discover visible safe buttons/links;
4. execute one interaction;
5. feed resulting snapshots/transitions into the existing graph/frontier;
6. compare discovered graph with benchmark ground truth.

Do not add form filling, AI, visual regression, persistence, or test generation in Phase 1B.

## Merge status

Phase 1A is not merged.
