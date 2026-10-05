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

## Changes in Phase 1A so far

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

### Policy v1

Added:

- same-origin crawl boundary;
- safe/mutating/destructive/unknown risk classes;
- conservative default execution policy;
- deterministic keyword-based initial risk classifier.

### Tests

Added lightweight unit coverage for:

- semantically equivalent reordered states;
- same-route dialog state differences;
- query-order normalization;
- same-origin boundary;
- external/non-HTTP blocking;
- risk classification;
- conservative default execution policy.

### Learning documentation

Added `docs/CONCEPTS.md` to make the core ideas understandable instead of hiding them behind implementation.

Key checkpoints:

- page vs state;
- graph vs tree;
- state vs snapshot vs fingerprint;
- false merge vs false split;
- interaction identity vs DOM identity;
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

## Verification performed

Repository/PR history and Phase 0 decisions were re-read before Phase 1A.

Implementation files and tests have been created.

Runtime verification is still pending on a local checkout. Do not treat Phase 1A as verified until:

```powershell
npm install
npm run typecheck
npm test
```

all pass.

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

## Acceptance criteria for Phase 1A

Before closing this phase:

- core schemas are defined;
- fingerprint candidate is deterministic;
- same-origin and action policies exist;
- state restoration strategy is documented;
- minimal benchmark graph and ground truth are implemented;
- graph/frontier logic exists independently of Playwright;
- unit tests pass locally;
- concepts are understandable without reading the implementation.

## Next implementation step

1. implement the in-memory directed state graph;
2. implement BFS frontier/deduplication;
3. implement the first synthetic benchmark fixture and explicit ground truth;
4. verify core behavior without Playwright;
5. only then begin Phase 1B Playwright adapter work.

## Learning priority

Understanding takes priority over publishing speed.

Before moving into Playwright integration, be able to explain:

1. why URL identity is insufficient;
2. why a graph is required instead of a binary tree;
3. what information a fingerprint intentionally discards;
4. the difference between a false merge and a false split;
5. why the frontier contains state/action pairs rather than URLs;
6. why a deterministic benchmark needs ground truth written before evaluation.

## Merge status

Phase 1A is not merged.
