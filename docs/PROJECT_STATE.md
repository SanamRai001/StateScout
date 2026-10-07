# Project State

## Goal

Build StateScout as both:

1. a practical semantic web-application state explorer; and
2. a reproducible software-testing research artifact.

## Current phase

**Phase 7 — Evidence-driven fingerprint v3**

## Branch

`feat/phase-7-fingerprint-v3`

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

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 21/21 passed, 0 failed;
- frozen v1 baseline remained 7/9;
- v1 false merges: 0;
- v1 false splits: 2;
- v2 result: 9/9;
- v2 accuracy: 1.0;
- v2 same-state precision/recall/F1: 1.0 / 1.0 / 1.0;
- v2 false merges: 0;
- v2 false splits: 0;
- accuracy delta: +0.2222222222222222;
- same-state F1 delta: +0.25;
- false-split delta: -2;
- non-tracking query and meaningful numeric-control guard tests passed;
- comparison output was written to `results/raw/phase-3-fingerprint-comparison.json`.

The single-run fingerprint timing values are recorded as raw observations only. They are not evidence that v2 is faster because this micro-benchmark is susceptible to startup/JIT/warm-up effects and needs repeated measurements before performance claims.

Phase 3 verification gate is complete. Fingerprint v2 remains an experimental candidate rather than the explorer default until broader browser-fixture validation.

## Phase 4 implementation

Phase 4 is complete in code and tests fingerprint v2 through actual Playwright observations rather than hand-constructed snapshots.

A frozen browser fixture now combines:

- irrelevant wrapper nesting;
- generated CSS classes and element IDs;
- generated test IDs;
- control reordering;
- tracking-query noise;
- volatile title clock time;
- a meaningful query-driven state;
- an open-dialog state;
- a disabled-affordance state.

The semantic observer should naturally discard DOM-only wrapper/class/id noise. Fingerprint v2 is specifically expected to remove the tracking/time false split while retaining all meaningful differences.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-4-browser-generalization
git pull --ff-only
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run experiment:equivalence
npm run experiment:fingerprint-comparison
npm run experiment:browser-generalization
```

Expected Phase 4 hypothesis:

- v1 produces one false split on the browser fixture and zero false merges;
- v2 classifies all 4 browser pairs correctly;
- v2 produces zero false splits and zero false merges;
- all earlier frozen v1/v2 research baselines remain unchanged.

First local Phase 4 gate exposed a benchmark-design defect before acceptance:

- TypeScript correctly rejected implicit evaluator types; the evaluator is now explicitly typed.
- The first browser run reported v2 as 3/4 with one false split.
- Root cause: the fixture used `?variant=base` vs `?variant=noise-b` to select test variants. Because `variant` is a non-tracking query parameter, v2 correctly treated it as semantic state.
- This was not evidence of a v2 regression; the benchmark had leaked its own fixture-control variable into the fingerprint input.
- Fixture selection now uses the URL fragment, which is intentionally outside the current semantic fingerprint, while real query parameters remain available for tracking/noise and meaningful-query cases.
- No fingerprint-v2 logic was changed in response to this failure.
- The corrected fixture then exposed a second harness issue: hash-only `page.goto` navigation is same-document navigation, so the fixture script did not rerun for the dialog/disabled variants. Both algorithms therefore received stale base DOM and falsely appeared to merge those states.
- Browser-fixture observation now explicitly reloads after navigation so the script renders from the complete target URL/fragment before each snapshot.
- Again, no fingerprint implementation was changed; the measurement harness was corrected instead.

Corrected whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 22/22 passed, 0 failed;
- Phase 2 frozen v1 baseline remained 7/9 with 0 false merges and 2 false splits;
- Phase 3 frozen comparison remained v2 9/9 with 0 false merges and 0 false splits;
- Phase 4 browser v1: 3/4, 0 false merges, 1 false split;
- Phase 4 browser v2: 4/4, 0 false merges, 0 false splits;
- meaningful query, dialog, and disabled-affordance browser states all remained distinct under v2;
- wrapper/class/id/test-id, tracking-query, and volatile-title noise was successfully treated as equivalent in the intended browser pair.

Phase 4 therefore supports the original hypothesis after correcting two independently documented harness defects. Fingerprint v2 itself was not changed to obtain the passing browser result.

Phase 4 verification gate is complete. v2 remains non-default until an end-to-end explorer strategy comparison is completed.

## Phase 5 implementation

Phase 5 moves the fingerprint comparison into the complete BFS explorer.

Architecture changes:

- `StateGraph` accepts an injectable `StateFingerprinter`;
- the default remains fingerprint v1 for backward compatibility;
- `exploreWithPlaywright` accepts the same optional strategy;
- replay verification uses the identical injected strategy, preventing mixed v1/v2 identity during restoration.

The frozen end-to-end fixture has two meaningful states, Home and Details. A safe "Refresh view" interaction changes only volatile title time, tracking query data, wrapper/class/id structure, and control ordering. This deliberately creates a state-space inflation opportunity for v1 while v2 should deduplicate the observation.

Measured outputs include:

- graph state count;
- graph transition count;
- attempted transitions;
- meaningful-state coverage;
- excess states above ground truth;
- failed transitions.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-5-explorer-strategy
git pull --ff-only
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run experiment:equivalence
npm run experiment:fingerprint-comparison
npm run experiment:browser-generalization
npm run experiment:explorer-strategy
```

Phase 5 acceptance hypothesis:

- both v1 and v2 retain 100% meaningful-state coverage;
- v2 produces exactly the two ground-truth meaningful states;
- v2 has zero excess states and zero failed transitions;
- v1 produces more excess states than v2;
- v1 attempts more transitions than v2;
- all Phase 2-4 frozen results remain unchanged.

v2 must remain non-default until this gate passes. A passing result would support promotion based on system-level exploration behavior rather than pairwise classification alone.

First local Phase 5 gate exposed a runtime-compatibility defect before the experiment could run:

- TypeScript typecheck passed;
- Node v24.19.0 with `--experimental-strip-types` rejected a constructor parameter property in `StateGraph`;
- the failure occurred before graph/explorer tests and the Phase 5 experiment could execute;
- the constructor was rewritten to use a normal readonly field plus assignment, preserving behavior while remaining compatible with strip-only TypeScript execution;
- the same run reconfirmed the frozen Phase 2, Phase 3, and Phase 4 experiment results before reaching the Phase 5 runtime failure.

This is an implementation/runtime defect, not evidence for or against the Phase 5 hypothesis.

Corrected Phase 5 whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed Phase 5 results:

- TypeScript typecheck: passed;
- tests: 23/23 passed, 0 failed;
- v1 explorer: 15 graph states, 20 graph transitions, 20 attempted transitions, 13 excess states, 100% meaningful-state coverage, 0 failed transitions;
- v2 explorer: 2 graph states, 3 graph transitions, 3 attempted transitions, 0 excess states, 100% meaningful-state coverage, 0 failed transitions;
- v2 reduced graph states by 13, graph transitions by 17, attempted transitions by 17, and excess states by 13 while preserving complete meaningful-state coverage.

Phase 5 therefore demonstrated a system-level reduction in state-space inflation and redundant BFS work on the controlled volatile-state fixture.

## Phase 6 implementation

Phase 6 deliberately attempts to falsify fingerprint v2 before any default promotion.

No fingerprint algorithm is changed in this phase. Instead, a frozen Playwright-observed adversarial benchmark defines six cases before measurement:

1. meaningful appointment time represented only in the page title;
2. a semantic `ref` query parameter identifying different invoices;
3. harmless UTM tracking noise;
4. a meaningful ordinary query ID;
5. meaningful clock time in a visible heading;
6. meaningful clock time in an interactive control name.

The first two cases directly challenge v2's current unconditional normalization rules:

- all clock-time tokens in titles are replaced with `<time>`;
- `ref` is always discarded as a tracking query key.

The expected adversarial result is therefore intentionally not "v2 gets everything right":

- v1: 5/6, 0 false merges, 1 false split;
- v2: 4/6, 2 false merges, 0 false splits;
- the exact v2 false merges should be `meaningful-title-time` and `semantic-ref-query`;
- heading time, control time, and ordinary non-tracking query IDs must remain distinct.

A Phase 6 pass means the experiment reproducibly exposes these risks without modifying v2 to fit the benchmark. That evidence will determine the design requirements for a future v3.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-6-adversarial-identity
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test

npm run experiment:equivalence
npm run experiment:fingerprint-comparison
npm run experiment:browser-generalization
npm run experiment:explorer-strategy
npm run experiment:adversarial-identity
```

All Phase 2-5 frozen results must remain unchanged. Fingerprint v2 remains non-default regardless of its earlier Phase 5 efficiency win until this adversarial risk is resolved.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 24/24 passed, 0 failed;
- Phase 2 frozen v1 baseline remained 7/9 with 0 false merges and 2 false splits;
- Phase 3 frozen comparison remained v2 9/9 with 0 false merges and 0 false splits;
- Phase 4 browser comparison remained v1 3/4 and v2 4/4;
- Phase 5 explorer comparison remained v1 15 states / 20 attempts versus v2 2 states / 3 attempts, with 100% meaningful-state coverage for both;
- Phase 6 v1: 5/6 correct, 0 false merges, 1 false split;
- Phase 6 v2: 4/6 correct, 2 false merges, 0 false splits;
- the exact v2 false merges were `meaningful-title-time` and `semantic-ref-query`;
- `tracking-utm-query`, `ordinary-query-id`, `meaningful-heading-time`, and `meaningful-control-time` behaved as expected.

Phase 6 therefore confirms that v2's efficiency gain comes with two measured false-merge hazards caused by unconditional normalization. v2 must not become the default identity strategy in its current form.

Phase 6 verification gate is complete.

## Phase 7 implementation

Phase 7 introduces fingerprint v3 from the measured Phase 6 failure modes while keeping v1 and v2 frozen.

V3 makes exactly two evidence-driven changes relative to v2:

1. removes `ref` from the unconditional tracking-query suppression set because Phase 6 demonstrated that `ref` can identify meaningful application state;
2. narrows title-time normalization from any `HH:MM[:SS]` clock to second-resolution `HH:MM:SS` clocks only.

The second rule is intentionally narrower rather than "context aware" in a broad heuristic sense. Every frozen volatile-title case from Phases 2, 4, and 5 uses second-resolution clocks such as `10:00:01 → 10:00:02`, while the measured meaningful Phase 6 appointment case uses minute-resolution time `10:00 → 11:00`.

This does not prove that every second-resolution clock is noise or every minute-resolution clock is semantic. V3 remains an experimental candidate whose purpose is to improve the measured tradeoff without hiding the remaining uncertainty.

All existing evaluators now include v3 while preserving v1/v2 outputs. A dedicated cross-benchmark Phase 7 report compares all three algorithms against the frozen evidence from Phases 2, 4, 5, and 6.

### Phase 7 acceptance hypothesis

- Phase 2 equivalence: v3 = 9/9, 0 false merges, 0 false splits;
- Phase 4 browser generalization: v3 = 4/4, 0 false merges, 0 false splits;
- Phase 5 explorer strategy: v3 = 2 graph states, 3 attempted transitions, 0 excess states, 100% meaningful-state coverage, 0 failed transitions;
- Phase 6 adversarial identity: v3 = 6/6, 0 false merges, 0 false splits;
- all v1/v2 frozen measurements remain unchanged;
- v3 remains non-default until this complete gate passes.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-7-fingerprint-v3
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test

npm run experiment:equivalence
npm run experiment:fingerprint-comparison
npm run experiment:browser-generalization
npm run experiment:explorer-strategy
npm run experiment:adversarial-identity
npm run experiment:fingerprint-v3
```

The Phase 7 experiment writes:

- full machine-readable evidence: `results/raw/phase-7-fingerprint-v3-comparison.json`;
- compact shareable summary: `results/raw/phase-7-fingerprint-v3-comparison-summary.txt`.

Experiment runners now keep terminal output compact instead of printing their entire JSON reports.

## Next phase after verification

If Phase 7 passes, v3 becomes the strongest identity candidate so far, but promotion should still be a separate decision. The next phase should validate v3 on a broader fixture set or realistic applications with naturally occurring volatility before changing the default explorer identity from v1.

## Merge status

Phases 1A through 6 are merged. Phase 7 implementation is complete on `feat/phase-7-fingerprint-v3` and awaits its single whole-phase verification gate.
