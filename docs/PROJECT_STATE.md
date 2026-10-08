# Project State

## Goal

Build StateScout as both:

1. a practical semantic web-application state explorer; and
2. a reproducible software-testing research artifact.

## Current phase

**Phase 21 — Research freeze and paper artifact**

## Branch

`feat/phase-21-research-freeze-paper-artifact`

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

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 29/29 passed, 0 failed;
- Phase 2 frozen baseline remained v1 7/9 and v2 9/9;
- Phase 7 v3 on Phase 2: 9/9, 0 false merges, 0 false splits;
- Phase 4 frozen comparison remained v1 3/4 and v2 4/4;
- Phase 7 v3 on Phase 4: 4/4, 0 false merges, 0 false splits;
- Phase 5 frozen explorer comparison remained v1 15 states / 20 attempts and v2 2 states / 3 attempts;
- Phase 7 v3 on Phase 5: 2 graph states, 3 graph transitions, 3 attempted transitions, 100% meaningful-state coverage, 0 excess states, 0 failed transitions;
- Phase 6 frozen adversarial comparison remained v1 5/6 and v2 4/6 with 2 false merges;
- Phase 7 v3 on Phase 6: 6/6, 0 false merges, 0 false splits.

V3 therefore preserves v2's measured state-space reduction while removing both measured v2 false-merge hazards. The complete cross-benchmark report is written to `results/raw/phase-7-fingerprint-v3-comparison.json`, with a compact summary in `results/raw/phase-7-fingerprint-v3-comparison-summary.txt`.

Phase 7 verification gate is complete. V3 is now the strongest identity candidate measured so far, but default promotion remains deferred until broader generalization validation.

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

## Phase 8 implementation

Phase 8 broadens validation before any default-fingerprint promotion.

It has two deliberately separate evidence layers.

### Layer A — frozen broader browser benchmark

A new 10-pair Playwright-observed benchmark expands the state-identity challenge beyond the earlier focused fixtures.

The frozen cases include:

- wrapper/generated-ID/test-ID/control-order noise;
- multiple known tracking query parameters;
- volatile second-resolution dashboard title clocks;
- semantic `ref` query values;
- meaningful minute-resolution title times;
- meaningful second-resolution title times;
- `aria-expanded` affordance changes;
- user-visible input value changes;
- ordinary semantic query values;
- dialog state.

The meaningful second-resolution title case is intentionally adversarial to v3. It represents an auction deadline where `10:00:01` and `10:00:02` are different meaningful states.

Expected frozen results:

- v1: 8/10, 0 false merges, 2 false splits;
- v2: 7/10, 3 false merges, 0 false splits;
- v3: 9/10, 1 false merge, 0 false splits;
- the exact expected v3 failure is `meaningful-second-title`.

A passing Phase 8 benchmark therefore does **not** mean v3 is perfect. It means broader validation reproducibly exposes its remaining unconditional second-resolution title normalization hazard.

### Layer B — read-only real-site observation

Phase 8 also observes three public browser-testing/demo targets without clicking, typing, submitting, or mutating state:

- Playwright's public TodoMVC demo;
- The Internet `challenging_dom` page;
- The Internet `dynamic_content` page.

Each target is loaded three times. StateScout records semantic snapshot summaries plus the number of unique v1/v2/v3 hashes across reloads.

These observations are external-validity evidence only. They have no manual same/different labels, do not define correctness, and do not fail the core phase merely because a live site is unreachable. This prevents network availability or third-party site changes from becoming fake algorithm evidence.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-8-broader-generalization
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:fingerprint-v3
npm run experiment:phase8
```

The Phase 8 experiment writes:

- full report: `results/raw/phase-8-broader-generalization.json`;
- compact shareable summary: `results/raw/phase-8-broader-generalization-summary.txt`.

The terminal remains compact.

## Phase 9 implementation

Phase 9 replaces clock-format guessing with scoped, evidence-backed volatility rules.

### Core design

A new volatility evidence layer introduces:

- `VolatilityField` for title and query-field candidates;
- a protected semantic anchor built from origin, path, non-excluded query data, headings, landmarks, dialogs, and normalized controls;
- `learnScopedVolatilityRule()`, which requires at least two trusted observations, requires the protected anchor to remain identical, and requires the candidate field itself to vary;
- `VolatilityProfile`, which stores trusted rules with provenance and binds every rule to the exact semantic anchor on which it was learned.

Repeated observations alone are not automatically trusted. The caller must supply a trusted same-state observation set. This is deliberate: an auction countdown and a noisy dashboard clock can look structurally identical as "changing title text," so repetition by itself cannot prove semantic irrelevance.

### Fingerprint v4 candidate

Fingerprint v4 removes title-clock regex normalization entirely.

It preserves the previously established fixed tracking-query suppression set, but any additional volatility suppression is applied only when a trusted profile rule matches the current semantic anchor.

This means:

- a Dashboard title rule can normalize unseen Dashboard title values;
- the same rule cannot affect an Auction state with different headings/controls;
- a Dashboard `refreshToken` rule cannot affect an Invoice state;
- `ref` remains semantic unless future scoped evidence explicitly supports otherwise.

V1, v2, and v3 remain frozen.

### Train/holdout benchmark

The Phase 9 fixture separates training observations from evaluation observations.

Training evidence:

- Dashboard title values `refresh A17` and `refresh B29`;
- Dashboard `refreshToken=A17` and `refreshToken=B29`.

Held-out evaluation uses unseen values `C31` and `D44` and also tests rule leakage into Auction and Invoice anchors.

Expected results:

- v1: 3/6, 0 false merges, 3 false splits;
- v2: 2/6, 2 false merges, 2 false splits;
- v3: 3/6, 1 false merge, 2 false splits;
- v4 with the learned scoped profile: 6/6, 0 false merges, 0 false splits;
- exactly two trusted scoped rules are learned.

Additional unit guards require the learner to reject training sets where the protected semantic anchor changes.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-9-observed-volatility
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:fingerprint-v3
npm run experiment:phase9
```

The Phase 9 experiment writes:

- full report: `results/raw/phase-9-observed-volatility.json`;
- compact shareable summary: `results/raw/phase-9-observed-volatility-summary.txt`.

### Research interpretation

A Phase 9 pass would show that scoped volatility evidence can solve the measured Dashboard noise without globally erasing meaningful second-resolution Auction state.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 33/33 passed, 0 failed;
- the Phase 7 v3 cross-benchmark remained unchanged;
- exactly 2 trusted scoped volatility rules were learned;
- v1: 3/6, 0 false merges, 3 false splits;
- v2: 2/6, 2 false merges, 2 false splits;
- v3: 3/6, 1 false merge, 2 false splits;
- v4: 6/6, 0 false merges, 0 false splits;
- held-out Dashboard title volatility generalized from training values A17/B29 to unseen C31/D44;
- held-out Dashboard refreshToken volatility generalized from training values A17/B29 to unseen C31/D44;
- the learned Dashboard title rule did not leak into the Auction anchor;
- the learned Dashboard refreshToken rule did not leak into the Invoice anchor;
- semantic ref values remained distinct;
- known tracking-query normalization remained intact.

Phase 9 therefore supports the core architecture: volatility evidence can be scoped to a protected semantic anchor and then applied to unseen values without globally deleting the same field from unrelated states.

Phase 9 verification gate is complete. V4 remains experimental because trust establishment is still externally supplied; automatic rule promotion remains a separate research problem.

It would **not** prove that StateScout can autonomously decide what is volatile. Trust establishment remains a separate research problem. The important architectural improvement is that normalization is now conditional on explicit evidence and semantic scope rather than on text format.

## Phase 10 implementation

Phase 10 begins automatic volatility discovery while keeping unsafe inferences quarantined until independent behavioral evidence supports promotion.

### Candidate lifecycle

A new candidate pipeline introduces:

- automatic candidate discovery from repeated observations where one candidate field varies and the protected semantic anchor remains stable;
- candidate status starts as `quarantined`;
- default promotion policy requires at least 4 observations, at least 2 independent sessions, at least 3 distinct field values, and at least 4 behavior confirmations;
- behavior confirmation is collected through a safe probe and summarized as a downstream semantic signature;
- every behavior-evidence record is bound back to the candidate's source anchor and must reference a value actually observed by that candidate;
- any divergent downstream behavior blocks promotion;
- only eligible candidates can be converted into trusted `ScopedVolatilityRule` entries with provenance `verified-candidate-promotion`.

Quarantined candidates never affect fingerprint identity.

### Phase 10 controlled benchmark

The benchmark creates two superficially similar title-volatility candidates.

Dashboard candidate:

- four changing title values across two sessions;
- all protected semantic anchors are identical;
- the safe `Inspect dashboard` probe always reaches the same downstream semantic state;
- expected: eligible and promoted.

Auction candidate:

- four changing second-resolution title values across two sessions;
- immediate protected anchors are also identical;
- the safe `Inspect auction` probe reaches two different downstream semantic states depending on the countdown value;
- expected: remains quarantined because behavior signatures diverge.

Held-out evaluation then checks unseen Dashboard and Auction title values.

Expected results:

- Dashboard candidate eligible: true;
- Dashboard behavior signature count: 1;
- Auction candidate eligible: false;
- Auction behavior signature count: 2;
- promoted trusted rules: 1;
- v3: 0/2, 1 false merge, 1 false split;
- v4 with no profile: 1/2, 0 false merges, 1 false split;
- v4 with verified promoted profile: 2/2, 0 false merges, 0 false splits.

### Safety interpretation

This phase does not claim that repeated stability alone proves semantic irrelevance. Promotion requires a separate safe behavioral probe and cross-session evidence.

Whole-phase verification passed on Windows x64 with Node v24.19.0 after correcting the earlier parse-only syntax defect.

Observed verification:

- TypeScript typecheck: passed;
- tests: 37/37 passed, 0 failed;
- Phase 9 frozen result remained v4 6/6 with 0 false merges and 0 false splits;
- Dashboard candidate: eligible = true;
- Dashboard behavior signature count: 1;
- Auction candidate: eligible = false;
- Auction behavior signature count: 2;
- Auction rejection reason: `safe probe produced divergent downstream behavior`;
- promoted trusted rules: 1;
- promoted rule provenance: `verified-candidate-promotion`;
- v3 held-out result: 0/2, 1 false merge, 1 false split;
- v4 without profile: 1/2, 0 false merges, 1 false split;
- v4 with verified promoted profile: 2/2, 0 false merges, 0 false splits.

The Dashboard candidate satisfied the full promotion policy across two sessions and four observed values while producing one stable downstream behavior signature. The Auction candidate satisfied the repetition/session/value thresholds but remained quarantined because its safe probe produced two downstream behavior signatures.

Phase 10 therefore supports the quarantine architecture: automatic candidate discovery can proceed independently from identity, and promotion can require independent behavioral evidence before a rule is allowed to affect fingerprinting.

Phase 10 verification gate is complete.

The behavioral verifier is still a controlled abstraction: real applications may need multiple probes, deeper transition signatures, time-delayed observations, or additional invariants before automatic promotion is safe enough for production use.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-10-volatility-candidate-promotion
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase9
npm run experiment:phase10
```

First local Phase 10 gate exposed a syntax defect before the Phase 10 hypothesis could run:

- TypeScript reported TS1005 in `src/core/volatilityCandidates.ts` at the candidate `sessionIds` expression;
- Node v24 strip-types reported the same parse failure;
- 33 pre-existing tests still passed, while the 2 Phase 10 tests failed at module parse time rather than assertion time;
- the frozen Phase 9 experiment still reproduced its verified 6/6 v4 result;
- Phase 10 itself did not execute, so this run provides no evidence for or against the candidate-promotion hypothesis;
- the malformed `new Set(...)` expression was corrected without changing candidate-promotion behavior or acceptance criteria.

The Phase 10 experiment writes:

- full report: `results/raw/phase-10-volatility-candidate-promotion.json`;
- compact shareable summary: `results/raw/phase-10-volatility-candidate-promotion-summary.txt`.

## Phase 11 implementation

Phase 11 integrates volatility evidence collection into the normal Playwright explorer while preserving a strict run-frozen identity boundary.

### Run-frozen identity

At exploration start, StateScout captures one `runFingerprinter` and uses that same function for:

- initial state insertion;
- replay verification;
- restored-source verification;
- destination-state insertion.

The new observation sidecar has no API to replace the run fingerprinter. Candidates discovered during a crawl therefore cannot change state identity mid-run.

### Observation-only explorer sink

`exploreWithPlaywright()` now accepts an optional synchronous `observationSink`.

The sink receives semantic snapshots from:

- the initial observation;
- replay steps;
- restored source states;
- post-interaction observations.

Sink exceptions are caught and returned as `evidenceErrors`; they do not abort or alter the graph. A dedicated fault-injection test requires graph state count, transition count, and attempted-transition count to remain identical when the evidence sink throws.

### Persistent evidence store

A new deterministic `VolatilityEvidenceStore` records unique:

`(sessionId, field, semantic anchor, observed value)`

tuples.

Design properties:

- evidence is collected for title and non-tracking query fields;
- duplicate observations within one session do not inflate evidence;
- merging the same store twice is idempotent;
- JSON serialization is stable;
- persisted stores can be parsed and merged in a later run;
- candidate discovery from the store produces only quarantined candidates;
- no evidence-store API promotes candidates or modifies fingerprint identity.

### Phase 11 controlled explorer benchmark

The Phase 11 fixture contains one meaningful Dashboard state whose title changes on every safe `Refresh view` interaction.

With empty-profile v4, the frozen identity intentionally treats each title as distinct during the run.

Expected baseline graph:

- 5 graph states;
- 4 graph transitions;
- 4 attempted transitions.

The experiment runs:

1. a baseline crawl without evidence collection;
2. session A with an evidence collector;
3. session B with an evidence collector.

Expected evidence:

- baseline graph signature equals session A graph signature;
- baseline graph signature equals session B graph signature;
- evidence errors are 0 for all three runs;
- session A store: 5 unique evidence records;
- session B store: 5 unique evidence records;
- merged store: 10 records across 2 session IDs;
- JSON round-trip is stable;
- merging the merged store with session A again is unchanged;
- exactly 1 quarantined candidate is discovered;
- candidate field: `title`;
- candidate sessions: 2;
- candidate distinct values: 5.

The experiment writes the two per-session evidence files and then reloads them from disk before creating the merged evidence artifact. This makes cross-run persistence an actual serialized handoff rather than an in-memory-only demonstration.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-11-explorer-evidence-store
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase10
npm run experiment:phase11
```

The Phase 11 experiment writes:

- full report: `results/raw/phase-11-explorer-evidence-store.json`;
- compact summary: `results/raw/phase-11-explorer-evidence-store-summary.txt`;
- session A evidence: `results/raw/phase-11-explorer-evidence-store-session-a-evidence.json`;
- session B evidence: `results/raw/phase-11-explorer-evidence-store-session-b-evidence.json`;
- merged evidence: `results/raw/phase-11-explorer-evidence-store-merged-evidence.json`.

### Research interpretation

A Phase 11 pass would show that StateScout can gather and persist candidate evidence during ordinary exploration without changing the graph being explored.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 39/39 passed, 0 failed;
- the frozen Phase 10 candidate-promotion result remained unchanged;
- baseline graph signature equaled session A graph signature;
- baseline graph signature equaled session B graph signature;
- graph remained 5 states, 4 transitions, and 4 attempted transitions in all compared runs;
- evidence errors were 0 for baseline, session A, and session B;
- session A evidence store contained 5 unique records;
- session B evidence store contained 5 unique records;
- merged evidence store contained 10 unique records across 2 session IDs;
- JSON persistence round-trip was stable;
- merging the already merged store with session A again was idempotent;
- exactly 1 quarantined candidate was discovered;
- the candidate field was `title`;
- the candidate contained 2 sessions and 5 distinct values;
- candidate status remained `quarantined`;
- the fault-injection test confirmed that evidence-sink failures do not alter graph state count, transition count, or attempted-transition count.

The persisted merged evidence contains the same protected title anchor across both session IDs and the five observed Dashboard refresh values. Phase 11 therefore demonstrates that candidate evidence can be accumulated across serialized runs while the identity function that produced each graph remains frozen and unaffected.

Phase 11 verification gate is complete.

It would not yet mean candidates can be promoted automatically from normal crawls. Phase 11 intentionally persists observation evidence only; behavioral verification and promotion remain outside the active crawl.

## Phase 12 implementation

Phase 12 closes the evidence loop without allowing any mid-run identity mutation.

### Between-run lifecycle

The intended lifecycle is now explicit:

1. Run N starts with a frozen identity profile.
2. Run N collects observation evidence only.
3. The run ends.
4. Separately collected safe behavior evidence is persisted.
5. An offline promotion step assesses quarantined candidates.
6. Eligible candidates are promoted into a new frozen profile artifact.
7. Run N+1 may load that artifact before exploration starts.
8. Run N+1 again freezes its identity for the entire crawl.

No promotion API is called from inside the explorer.

### Persistent behavior evidence

A new deterministic `VolatilityBehaviorEvidenceStore` persists:

- behavior session ID;
- source semantic anchor;
- observed candidate field value;
- downstream behavior signature.

The store supports deterministic serialization, parsing, deduplication, and idempotent merging.

### Offline promotion artifact

`buildOfflineVolatilityProfile()` consumes:

- a persisted observation evidence store;
- a separately persisted behavior evidence store.

It discovers quarantined candidates, applies the Phase 10 promotion policy, promotes only eligible candidates, and produces a frozen profile artifact containing:

- promoted v4 volatility rules;
- every promotion decision and assessment;
- SHA-256 digest of the observation evidence;
- SHA-256 digest of the behavior evidence;
- explicit provenance `offline-between-run-promotion`.

The artifact is serialized independently and can be loaded by a future process.

### Phase 12 controlled benchmark

The fixture contains:

- a Dashboard state with a volatile title;
- a safe `Refresh view` interaction;
- a safe `Inspect dashboard` probe whose downstream result is invariant across title values;
- a stable Details state.

Two normal crawls collect observation evidence with empty-profile v4.

Frozen observation expectations:

- exactly 1 quarantined candidate;
- candidate field: `title`;
- candidate observation sessions: 2;
- candidate distinct values: 4.

Separate behavior verification covers the same four title values across two behavior sessions.

Expected offline decision:

- behavior evidence records: 4;
- promotion decision: true;
- promoted trusted rules: 1;
- promoted rule provenance: `verified-candidate-promotion`;
- frozen profile serialization round-trip: stable;
- both observation and behavior evidence digests are present.

### Future-run system effect

The benchmark freezes both sides of the between-run comparison.

Future run without the promoted profile:

- 5 graph states;
- 6 graph transitions;
- 6 attempted transitions;
- 0 failed transitions.

Fresh future run started from the persisted promoted profile:

- 2 graph states;
- 3 graph transitions;
- 3 attempted transitions;
- 0 failed transitions.

The experiment writes the profile to disk, reads it back, opens a new browser page, and starts the future crawl from the parsed profile. The improved identity therefore enters only at the next run boundary.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-12-offline-profile-promotion
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase11
npm run experiment:phase12
```

The Phase 12 experiment writes:

- full report: `results/raw/phase-12-offline-profile-promotion.json`;
- compact summary: `results/raw/phase-12-offline-profile-promotion-summary.txt`;
- crawl A observation evidence;
- crawl B observation evidence;
- merged observation evidence;
- behavior evidence;
- frozen volatility profile artifact.

### Research interpretation

A Phase 12 pass would demonstrate a complete safe learning loop across run boundaries: evidence gathered during ordinary exploration can be verified offline, converted into a provenance-bearing profile artifact, and applied only to a fresh future crawl.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 40/40 passed, 0 failed;
- Phase 11 frozen explorer-evidence result remained unchanged;
- quarantined candidates discovered: 1;
- candidate field: `title`;
- candidate observation sessions: 2;
- candidate distinct values: 4;
- behavior evidence records: 4;
- promotion decision: true;
- promoted trusted rules: 1;
- promoted rule provenance: `verified-candidate-promotion`;
- frozen profile serialization round-trip: stable;
- observation evidence SHA-256 digest present;
- behavior evidence SHA-256 digest present;
- future run without profile: 5 states, 6 transitions, 6 attempts, 0 failed transitions;
- future run using the in-memory promoted profile: 2 states, 3 transitions, 3 attempts, 0 failed transitions;
- fresh future run using the profile reloaded from disk: 2 states, 3 transitions, 3 attempts, 0 failed transitions.

The candidate was supported by 8 observation records across two crawl sessions and four distinct Dashboard title values. The four behavior-evidence records across two separate behavior sessions all produced the same downstream semantic signature.

The frozen profile artifact recorded the exact observation-evidence and behavior-evidence digests used for the decision, making the promotion provenance auditable.

Phase 12 therefore demonstrates the intended between-run boundary: Run N collects evidence without changing identity; offline verification promotes an eligible candidate only after the run ends; Run N+1 can then start from the frozen profile and achieve the measured state-space reduction.

Phase 12 verification gate is complete.

It would still not establish that the current single-probe promotion policy is sufficient for arbitrary real applications. Broader probe sets, conflict handling, profile revocation, and stale-evidence detection remain open research problems.

## Phase 13 implementation

Phase 13 makes trusted volatility rules revocable when later application behavior contradicts the evidence that originally justified them.

### Revalidation evidence

A new deterministic `RuleRevalidationEvidenceStore` persists later safe-probe observations with:

- session ID;
- exact volatility field;
- source semantic anchor;
- newly observed field value;
- downstream behavior signature.

The field is explicit so behavior evidence for one rule cannot accidentally challenge another rule that shares the same semantic anchor.

### Offline revalidation policy

Revalidation remains between runs and outside the explorer.

The default policy requires:

- at least 4 later behavior confirmations;
- at least 2 later sessions;
- at least 3 distinct later field values.

A trusted rule can receive three outcomes:

- `retained`: sufficient later evidence still produces one downstream behavior signature;
- `revoked`: sufficient later evidence produces divergent downstream behavior signatures;
- `insufficient-evidence`: not enough later evidence exists to make a revocation decision.

Insufficient evidence does not revoke an existing rule. Revocation requires positive contradictory evidence.

### Frozen revision artifact

`buildRevalidatedVolatilityProfile()` produces an auditable profile-revision artifact containing:

- the next trusted profile;
- every rule revalidation decision;
- SHA-256 digest of the parent frozen profile;
- SHA-256 digest of the later challenge evidence;
- explicit provenance `offline-between-run-revalidation`.

Revoked rules are removed from the next profile. Retained and insufficient-evidence rules remain until stronger evidence exists.

### Phase 13 controlled benchmark

The benchmark first reproduces a valid trusted Dashboard-title rule using the Phase 12 style promotion process.

It then freezes two later scenarios against the same semantic anchor.

Stable future:

- later values 5, 6, 7, and 8;
- 4 behavior confirmations across 2 sessions;
- all safe probes reach the same downstream semantic state;
- expected decision: `retained`;
- expected behavior signatures: 1;
- resulting trusted rules: 1.

Evolved future:

- the same later title values 5, 6, 7, and 8;
- 4 behavior confirmations across 2 sessions;
- odd and even refresh values now reach different downstream semantic states;
- expected decision: `revoked`;
- expected behavior signatures: 2;
- resulting trusted rules: 0.

The immediate Dashboard snapshot deliberately keeps the same protected semantic anchor after the simulated application evolution. This makes the stale trusted rule dangerous rather than automatically harmless through anchor mismatch.

### System-level stale-profile effect

The benchmark freezes the future explorer behavior before and after revocation.

Evolved app using the stale trusted profile:

- meaningful Details coverage: 0.5;
- graph states: 2;
- graph transitions: 3;
- attempted transitions: 3;
- failed transitions: 0;
- only `Dashboard standard details` is discovered.

Evolved app after offline revocation and loading the revised profile on a new crawl:

- meaningful Details coverage: 1.0;
- graph states: 6;
- graph transitions: 6;
- attempted transitions: 6;
- failed transitions: 0;
- both `Dashboard standard details` and `Dashboard priority details` are discovered.

The larger graph after revocation is intentional: once previous volatility assumptions become unsafe, StateScout falls back toward conservative identity so reachable semantic behavior is not silently hidden.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-13-profile-revalidation-revocation
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase12
npm run experiment:phase13
```

First local Phase 13 gate exposed a replay-reset defect before the system-level revocation result could be accepted:

- TypeScript passed;
- 44/45 tests passed;
- all core revalidation policy tests passed;
- stable later evidence correctly produced `retained` with 1 behavior signature and 1 resulting rule;
- evolved later evidence correctly produced `revoked` with 2 behavior signatures and 0 resulting rules;
- the frozen Phase 12 experiment remained unchanged;
- the browser integration test failed because the observation crawl accumulated 7 Dashboard title values instead of the frozen 4;
- the evolved crawl after revocation produced replay failures and 0 meaningful Details coverage instead of the frozen full-coverage result.

Root cause was not the revalidation policy. The explorer used `page.goto(startUrl)` as its reset operation. When the benchmark start URL was a same-document hash URL, Playwright could change or revisit the fragment without recreating the document, leaving JavaScript state such as the refresh counter alive across replay attempts.

This is the same browser semantic previously encountered in Phase 4, but here it exposed a real explorer replay-reset weakness.

The explorer now uses an explicit start-state navigation helper:

- if the current and target URLs refer to the same document (same origin, path, and query), it sets the requested URL when needed and then forces `page.reload()`;
- otherwise it performs the normal full `page.goto()`;
- the same reset path is used for both the initial exploration observation and every replay restoration.

A dedicated regression fixture primes `#seed-99`, mutates its in-memory state, then explores from `#seed-1`. The frozen expectation is 4 states, 3 transitions, 3 attempts, titles Counter 1 through Counter 4, and 0 failed transitions.

The Phase 13 scientific criteria remain unchanged. The gate must be rerun after this replay fix.

The Phase 13 experiment writes:

- full report: `results/raw/phase-13-profile-revalidation.json`;
- compact summary: `results/raw/phase-13-profile-revalidation-summary.txt`;
- parent trusted profile;
- stable later evidence;
- evolved later evidence;
- retained profile revision;
- revoked profile revision.

The experiment reloads the persisted stale parent profile and persisted revoked revision from disk before the final evolved-app comparison crawls.

### Research interpretation

A Phase 13 pass would show that StateScout can reverse a previously beneficial abstraction when later behavior demonstrates that the application has changed.

Whole-phase verification passed on Windows x64 with Node v24.19.0 after correcting the same-document replay-reset defect.

Observed verification:

- TypeScript typecheck: passed;
- tests: 46/46 passed, 0 failed;
- the new same-document replay reset regression passed;
- the frozen Phase 12 offline-promotion result remained unchanged;
- parent trusted rules: 1;
- stable revalidation: `retained`, 1 behavior signature, 1 resulting trusted rule;
- evolved revalidation: `revoked`, 2 behavior signatures, 0 resulting trusted rules;
- both stable and evolved profile revisions survived serialization round-trip;
- parent-profile SHA-256 digest present;
- challenge-evidence SHA-256 digest present;
- evolved run with stale profile: meaningful Details coverage 0.5, 2 states, 3 transitions, 3 attempts;
- evolved run after revocation: meaningful Details coverage 1.0, 6 states, 6 transitions, 6 attempts;
- failed transitions after revocation: 0.

The stable later evidence therefore preserved a still-valid abstraction, while the evolved later evidence revoked the stale abstraction after replicated safe probes produced divergent downstream behavior.

The stale profile hid one of the two reachable meaningful Details outcomes. Removing the revoked rule in the next profile restored both outcomes on the next crawl.

Phase 13 therefore demonstrates a defeasible abstraction lifecycle: trusted rules can remain trusted under stable evidence, but can be withdrawn when sufficiently replicated later behavior contradicts the original equivalence assumption.

Phase 13 verification gate is complete.

The important safety property is asymmetric: insufficient evidence does not erase trust, but sufficiently replicated contradictory behavior can revoke it before a future crawl begins.

This still does not solve when revalidation should be scheduled in real deployments, how long evidence should remain valid, or how to distinguish temporary experiments/A-B tests from permanent semantic drift.

## Phase 14 implementation

Phase 14 replaces permanent binary trust with a freshness-aware, scope-aware lifecycle for promoted volatility rules.

### Lifecycle states

Each promoted rule now has an offline lifecycle state:

- `trusted`: eligible for the active profile when fresh and scope-matched;
- `challenged`: one sufficiently replicated contradictory evidence window has appeared; the rule is immediately removed from the next active profile, but is not permanently revoked yet;
- `revoked`: contradictory behavior persisted across the configured number of distinct challenge windows;
- `cooldown`: a revoked rule has started producing stable behavior again but has not yet accumulated enough independent stable windows for restoration.

Only `trusted` entries can be materialized into a future crawl profile.

### Challenge-window policy

The frozen Phase 14 policy requires:

- 2 contradictory evidence windows before permanent revocation;
- 2 stable evidence windows before restoration after revocation;
- the existing Phase 13 per-window evidence threshold of 4 behavior confirmations, 2 sessions, and 3 distinct values.

A single contradictory window therefore causes safe conservative fallback without permanently destroying trust.

If the next sufficiently supported window is stable, `challenged -> trusted` clears the transient challenge.

### Window idempotency

Every evidence window has a stable `windowId`.

A window already present in `processedWindowIds` cannot increment conflict or recovery counters again. Re-importing the same A/B-test evidence therefore cannot accidentally escalate `challenged -> revoked`.

Duplicate windows are recorded with status `duplicate-window` and leave the trust state unchanged.

### Freshness and application scope

Lifecycle artifacts carry an explicit application/version scope string.

A trusted rule is omitted from the active future profile when:

- the requested application scope differs from the rule's lifecycle scope; or
- the rule's last successful verification is older than `maxTrustAgeMs`.

Incoming evidence windows are also rejected for lifecycle mutation when:

- their application scope differs; or
- they are older than `maxEvidenceAgeMs` relative to the offline decision time.

The Phase 14 controlled policy uses a 3-day trust freshness limit and a 1-day evidence-window freshness limit so these behaviors can be exercised deterministically.

### Auditable lifecycle chain

Each lifecycle revision records:

- SHA-256 of its immediate parent artifact;
- SHA-256 of the evidence window being evaluated when applicable;
- generated-at timestamp;
- lifecycle policy;
- processed window IDs;
- per-rule transition decisions.

Even duplicate, stale, and wrong-scope evaluation steps point to the immediate parent artifact they evaluated.

### Frozen Phase 14 sequence

The benchmark freezes this sequence for one valid Dashboard title rule:

1. stable window -> `trusted`, active rules = 1;
2. first transient conflict -> `challenged`, active rules = 0;
3. duplicate import of that exact conflict window -> still `challenged`, active rules = 0;
4. stable window -> challenge cleared -> `trusted`, active rules = 1;
5. first persistent conflict window -> `challenged`, active rules = 0;
6. second distinct persistent conflict window -> `revoked`, active rules = 0;
7. first stable recovery window -> `cooldown`, active rules = 0;
8. second stable recovery window -> restored `trusted`, active rules = 1.

Additional frozen checks:

- stale evidence window status: `stale-evidence`;
- wrong application-scope evidence status: `scope-mismatch`;
- expired trusted rule active rules: 0;
- wrong-scope materialization active rules: 0;
- lifecycle artifact serialization round-trip: stable.

### System-level challenged-state safety

The first contradictory window does not wait for permanent revocation before protecting coverage.

The challenged lifecycle state materializes an empty volatility profile for the next crawl. On the evolved Phase 13 fixture, that future conservative crawl is expected to recover:

- meaningful Details coverage: 1.0;
- graph states: 6;
- graph transitions: 6;
- attempted transitions: 6;
- failed transitions: 0.

This separates immediate safety from permanent trust destruction.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-14-trust-lifecycle-freshness-final
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase13
npm run experiment:phase14
```

First local Phase 14 gate produced the expected runtime/research results but exposed one strict-TypeScript benchmark typing defect:

- `npm test`: 50/50 passed;
- frozen Phase 13 result remained unchanged;
- Phase 14 lifecycle experiment matched every frozen behavioral expectation;
- strict `tsc --noEmit` failed because the helper parameter `applicationScope` was inferred from the default value as the literal type `"statescout-fixture:v1"`;
- the intentional wrong-scope case passes `"statescout-fixture:v2"`, so TypeScript rejected the benchmark call even though the runtime behavior was correct;
- the helper parameter is now explicitly typed as `string`;
- no lifecycle policy, state transition, benchmark expectation, or experiment logic was changed.

The Phase 14 gate remains incomplete until strict TypeScript is rerun successfully after this type-only fix.

The Phase 14 experiment writes:

- full report: `results/raw/phase-14-trust-lifecycle.json`;
- compact summary: `results/raw/phase-14-trust-lifecycle-summary.txt`;
- final restored lifecycle artifact: `results/raw/phase-14-trust-lifecycle-final-artifact.json`.

### Research interpretation

A Phase 14 pass would show that StateScout can keep abstraction trust defeasible without oscillating on one duplicated or transient evidence window.

Whole-phase verification passed on Windows x64 with Node v24.19.0 after the type-only benchmark scope fix.

Observed verification:

- TypeScript typecheck: passed;
- tests: 50/50 passed, 0 failed;
- frozen Phase 13 result remained unchanged;
- stable retain: `trusted`, active rules = 1;
- transient conflict: `challenged`, active rules = 0;
- duplicate conflict import: `duplicate-window`, state remained `challenged`;
- challenge-clearing stable window: `trusted`, active rules = 1;
- persistent conflict sequence: `challenged -> revoked`;
- recovery sequence: `cooldown -> trusted`;
- stale evidence status: `stale-evidence`;
- wrong-scope evidence status: `scope-mismatch`;
- expired trust active rules: 0;
- wrong-scope materialization active rules: 0;
- lifecycle artifact serialization round-trip: stable;
- challenged evolved-app run: meaningful Details coverage 1.0, 6 states, 6 transitions, 6 attempts, 0 failed transitions.

The first contradictory evidence window therefore disabled the rule for the next crawl before permanent revocation, while duplicate evidence could not escalate the lifecycle. A later stable window cleared the transient challenge. Two distinct contradictory windows were required for revocation, and two stable recovery windows were required for restoration.

Phase 14 verification gate is complete.

The safety strategy becomes:

- challenge quickly;
- stop using challenged trust on the next run;
- revoke only after repeated contradiction;
- restore only after repeated stability;
- refuse stale or wrong-version evidence;
- expire trust that has not been refreshed.

## Phase 15 implementation

Phase 15 moves from a single trusted-rule lifecycle to a multi-rule profile with deterministic selective revalidation under a fixed verification budget.

### Why selective revalidation

A real application may accumulate many volatility rules. Revalidating every rule on every cycle would erase much of the efficiency gained from semantic abstraction.

Phase 15 therefore introduces a deterministic priority heuristic v1.

For each lifecycle rule:

`priority = state urgency + freshness risk + conflict history + estimated coverage impact`

The components are deliberately explicit and inspectable.

State urgency:

- trusted: 0;
- challenged: 100;
- cooldown: 40;
- revoked: 30.

Freshness risk:

- applies only to currently trusted rules;
- scales linearly from 0 to 60 as the rule approaches `maxTrustAgeMs`;
- is capped at 60.

Conflict history:

- 10 points per recorded conflict window;
- capped at 20.

Estimated coverage impact:

- 5 points per estimated affected state;
- capped at 10 affected states / 50 points.

These weights are a transparent research heuristic, not a claim of optimal scheduling. Later ablation work must test whether the components and weights actually improve outcomes.

### Frozen multi-rule benchmark

The Phase 15 benchmark contains four independent lifecycle entries:

1. high-impact challenged rule:
   - state: `challenged`;
   - estimated affected states: 8;
   - expected score: 150.

2. aging trusted rule:
   - state: `trusted`;
   - verified 9/10ths of the trust-age window ago;
   - estimated affected states: 6;
   - expected score: 84.

3. medium-impact cooldown rule:
   - state: `cooldown`;
   - prior conflict history: 2 windows;
   - estimated affected states: 4;
   - expected score: 80.

4. fresh low-impact trusted rule:
   - state: `trusted`;
   - recently verified;
   - estimated affected states: 1;
   - expected score: 11.

Frozen ranking:

```text
challenged-critical:150
>
trusted-aging:84
>
cooldown-medium:80
>
trusted-fresh-low:11
```

### Fixed verification budget

The frozen revalidation budget is 2 rules.

Expected selection:

- `anchor-challenged-critical`;
- `anchor-trusted-aging`.

Expected work reduction:

- 4 rules exist;
- 2 are scheduled;
- selected fraction = 0.5;
- 2 rule probes are not scheduled in this cycle.

The benchmark does not claim that skipping a rule proves it is safe forever. It only measures whether a deterministic bounded scheduler can focus verification work on the currently higher-priority rules.

### Multi-rule lifecycle isolation

The benchmark then provides a sufficient stable evidence window only for the highest-priority challenged rule.

Expected transition:

- challenged critical rule: `challenged -> trusted` with decision `challenge-cleared`.

All other rules receive no matching evidence and must preserve their lifecycle state:

- aging trusted rule remains `trusted`;
- cooldown rule remains `cooldown`;
- fresh low-impact rule remains `trusted`.

Their decisions are expected to remain `insufficient-evidence`.

This verifies that one rule's revalidation does not accidentally mutate unrelated lifecycle entries.

### Determinism and metadata completeness

The scheduler must:

- produce the same ranking regardless of metadata input order;
- reject incomplete impact metadata rather than silently assigning a default risk;
- reject invalid negative/non-integer impact estimates;
- reject invalid verification budgets.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-15-multirule-selective-revalidation
git pull --ff-only
npm install

npm run typecheck
npm test
npm run experiment:phase14
npm run experiment:phase15
```

Expected Phase 15 compact summary:

```text
Rules ranked: 4
Revalidation budget: 2
Ranking: anchor-challenged-critical:150 > anchor-trusted-aging:84 > anchor-cooldown-medium:80 > anchor-trusted-fresh-low:11
Selected anchors: anchor-challenged-critical, anchor-trusted-aging
Selected fraction: 0.5
Saved rule probes: 2
Selected rule decision: challenge-cleared
Untouched rule states preserved: true
```

The experiment writes:

- full report: `results/raw/phase-15-selective-revalidation.json`;
- compact summary: `results/raw/phase-15-selective-revalidation-summary.txt`.

### Research interpretation

A Phase 15 pass would demonstrate that multiple volatility rules can coexist with independent lifecycle state and that StateScout can schedule a bounded subset for verification using transparent risk signals.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 53/53 passed, 0 failed;
- frozen Phase 14 lifecycle result remained unchanged;
- rules ranked: 4;
- revalidation budget: 2;
- frozen ranking reproduced exactly: `150 > 84 > 80 > 11`;
- selected anchors: `anchor-challenged-critical`, `anchor-trusted-aging`;
- selected fraction: 0.5;
- saved rule probes: 2;
- selected challenged rule decision: `challenge-cleared`;
- unrelated lifecycle entries preserved their previous states;
- unrelated rule decisions remained `insufficient-evidence`.

The bounded scheduler therefore selected only half of the available rules while still prioritizing the challenged high-impact rule and the aging trusted rule ahead of cooldown and fresh low-impact rules.

The isolation check also confirms that applying evidence for one selected rule does not mutate unrelated lifecycle entries.

Phase 15 verification gate is complete.

It would not establish that the priority formula is optimal. The exact weights remain a candidate policy that should later be challenged through ablation and broader benchmarks.

## Phase 16 implementation

Phase 16 separates immutable historical evidence from the currently active abstraction.

### Raw observation archive

A new `RawStateArchive` stores immutable semantic history:

- raw observation ID;
- session ID;
- observed timestamp;
- full semantic snapshot;
- strict semantic fingerprint;
- raw transitions between observation IDs;
- full interaction metadata;
- transition status and error when present.

Raw archive construction is deterministic:

- duplicate identical IDs are deduplicated;
- conflicting observation IDs are rejected;
- conflicting transition IDs are rejected;
- transitions referencing unknown raw observations are rejected;
- serialization is stable;
- the archive has a reproducible SHA-256 digest.

The archive uses strict fingerprint v1 only as immutable observation provenance. It does not use that strict fingerprint as the active equivalence policy.

### Alias / projection layer

`projectRawStateArchive()` applies any supplied `StateFingerprinter` to the stored raw snapshots and produces a derived projected graph.

Projected states contain:

- current alias state ID;
- current projected fingerprint;
- all raw observation IDs represented by that alias.

Projected transitions contain:

- projected source state;
- projected destination state;
- interaction identity;
- transition status;
- every raw transition ID represented by that derived edge.

The projection never edits the raw archive.

### Frozen historical benchmark

The frozen history contains:

- 6 raw semantic observations;
- 7 raw transitions;
- 4 Dashboard observations whose titles are `refresh 1` through `refresh 4`;
- 1 standard Details observation;
- 1 priority Details observation.

A trusted title-volatility rule initially aliases the four Dashboard observations.

Expected trusted projection:

- projected states: 3;
- projected transitions: 6;
- Dashboard alias members: 4;
- raw transitions `raw-transition-4` and `raw-transition-5` merge into one projected transition while both provenance IDs remain attached.

### Historical reinterpretation after revocation

The same raw archive is then projected with the title rule removed.

Expected revoked projection:

- projected states: 6;
- projected transitions: 7;
- recovered Dashboard states: 4.

No browser crawl is performed between trusted and revoked projections.

The four historical Dashboard distinctions are recovered only because their original raw snapshots were preserved.

### Restoration check

The same immutable archive is projected again with the original trusted rule restored.

Expected restored projection:

- projected states: 3;
- projected transitions: 6.

The raw archive SHA-256 digest must remain identical before and after every projection.

### Research boundary

Phase 16 establishes the reversible archive and alias semantics in the browser-independent core.

It does not yet claim that every normal Playwright exploration automatically persists its entire raw execution history into this archive. Existing browser observation and evidence mechanisms can feed this layer, but full crawl-to-archive integration is intentionally left separate from the core reversibility proof so the historical model can be evaluated independently.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-16-reversible-equivalence-archive
git pull --ff-only
npm install

npm run typecheck
npm test
npm run experiment:phase15
npm run experiment:phase16
```

Expected Phase 16 compact summary:

```text
Raw observations/transitions: 6/7
Raw archive round-trip stable: true
Trusted projection states/transitions: 3/6
Trusted Dashboard alias members: 4
Merged projected edge raw transition ids: raw-transition-4, raw-transition-5
Revoked projection states/transitions: 6/7
Revoked Dashboard states recovered: 4
Restored projection states/transitions: 3/6
Raw archive digest unchanged across reprojection: true
```

The experiment writes:

- full report: `results/raw/phase-16-reversible-equivalence.json`;
- compact summary: `results/raw/phase-16-reversible-equivalence-summary.txt`.

### Research interpretation

A Phase 16 pass would demonstrate that semantic abstraction no longer has to destroy historical distinctions.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 56/56 passed, 0 failed;
- frozen Phase 15 selective-revalidation result remained unchanged;
- raw observations: 6;
- raw transitions: 7;
- raw archive serialization round-trip: stable;
- trusted projection: 3 states, 6 transitions;
- trusted Dashboard alias members: 4;
- merged projected edge preserved raw transition provenance for `raw-transition-4` and `raw-transition-5`;
- revoked projection: 6 states, 7 transitions;
- historical Dashboard states recovered after removing the rule: 4;
- restored trusted projection: 3 states, 6 transitions;
- raw archive SHA-256 digest remained unchanged across trusted, revoked, and restored reprojections.

Phase 16 therefore demonstrates reversible historical abstraction in the core model: StateScout can preserve raw observations and transitions once, compress them through a trusted equivalence projection, later remove that abstraction, and recover the historical distinctions without re-crawling or mutating the source archive.

Phase 16 verification gate is complete.

StateScout can preserve raw observations and transitions once, project them through a trusted abstraction for efficiency, later remove that abstraction, and recover the historical distinctions without re-crawling.

This is important because a later challenge or revocation can reinterpret old evidence rather than discovering that the earlier abstraction permanently erased it.

## Phase 17 implementation

Phase 17 broadens the controlled evaluation surface before any new fingerprint or observer changes are allowed.

### Frozen corpus

A new `benchmarks/corpus-v1` corpus defines 16 labeled browser-observed pairs across 7 semantic families.

Frozen label counts:

- total pairs: 16;
- expected same: 4;
- expected different: 12;
- families: 7.

Families:

1. structural noise;
2. control state;
3. form state;
4. navigation;
5. overlay/dialog state;
6. temporal state;
7. content coverage.

Ground truth was committed before the corpus evaluator and before any Phase 17 measurement code.

### Structural-noise cases

The corpus includes:

- generated wrapper/class/ID/test-ID and whitespace noise;
- equivalent control-order changes;
- known tracking-query noise.

All three are expected to remain semantically equivalent.

### Control-state cases

The corpus freezes meaningful differences for:

- selected tab state;
- expanded/collapsed state;
- checkbox checked state;
- disabled affordance state.

### Form and navigation cases

The corpus includes:

- different visible input values;
- different semantic record query values;
- query-key order noise;
- two different application paths with otherwise matching visible semantics.

### Overlay and temporal cases

The corpus includes:

- base page versus open dialog;
- two dialogs with different accessible identities;
- second-resolution auction title values that remain meaningful.

The temporal case deliberately protects the Phase 8 lesson that a clock-like token is not globally safe to normalize.

### Content-coverage challenge cases

Two cases intentionally exercise user-visible state outside the current observer feature set:

- different ordinary paragraph status text with identical title/headings/controls;
- different visible list contents with identical title/headings/controls.

The current observer does not include arbitrary body text or list-item content in `SemanticStateSnapshot`.

These cases are therefore expected to expose false merges in the current v4-empty-profile baseline.

Phase 17 must not change the observer or fingerprint implementation to make these cases pass.

### Reusable evaluator

The corpus evaluator is separated into:

- browser observation of the frozen corpus;
- generic evaluation of already-observed pairs with any `StateFingerprinter`;
- the Phase 17 current-baseline evaluation using v4 with an empty volatility profile.

This makes the same frozen observed corpus reusable for Phase 18 baseline and ablation experiments without rewriting ground truth.

### Frozen current-v4 hypothesis

Before local execution, the Phase 17 current-v4 expectation is:

- total: 16;
- correct: 14;
- accuracy: 0.875;
- false merges: 2;
- false splits: 0.

Expected failures:

- `plain-status-text-state`;
- `list-content-state`.

Expected family behavior:

- all non-content-coverage families classify every pair correctly;
- content-coverage: 0/2 correct, 2 false merges, 0 false splits.

A Phase 17 pass means the benchmark reproduces these known limitations without changing the identity algorithm to fit the corpus.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-17-broader-benchmark-corpus
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase16
npm run experiment:phase17
```

Expected Phase 17 compact summary:

```text
Cases/families: 16/7
Correct/accuracy: 14/0.875
False merges: 2
False splits: 0
Failures: plain-status-text-state, list-content-state

content-coverage: 0/2, FM=2, FS=0
all other families: complete correctness
```

The experiment writes:

- full report: `results/raw/phase-17-broader-corpus.json`;
- compact summary: `results/raw/phase-17-broader-corpus-summary.txt`.

### Research interpretation

Phase 17 is a generalization benchmark phase, not an optimization phase.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 57/57 passed, 0 failed;
- frozen Phase 16 reversible-equivalence result remained unchanged;
- corpus cases/families: 16/7;
- correct: 14/16;
- accuracy: 0.875;
- false merges: 2;
- false splits: 0;
- failures: `plain-status-text-state`, `list-content-state`;
- content-coverage family: 0/2 correct, 2 false merges, 0 false splits;
- control-state: 4/4;
- form-state: 1/1;
- navigation: 3/3;
- overlay: 2/2;
- structural-noise: 3/3;
- temporal: 1/1.

The frozen corpus therefore reproduced the expected observer-level limitation without changing the observer or fingerprint to fit the benchmark.

All non-content-coverage families classified correctly. Both observed failures are cases where meaningful user-visible information exists only in ordinary status/list content that is not represented in the current semantic snapshot.

Phase 17 verification gate is complete.

A passing result would show that the current semantic identity stack generalizes across a broader set of structural, control, form, navigation, overlay, and temporal patterns while also exposing a specific observer-level blind spot for meaningful non-interactive content.

The two expected failures are scientifically useful because they identify a limitation in what StateScout observes, rather than another regex/fingerprint normalization problem.

## Phase 18 implementation

Phase 18 evaluates multiple identity strategies and feature ablations against the exact frozen Phase 17 corpus.

No Phase 17 labels or fixtures are changed.

### One observed corpus, many strategies

Phase 18 observes the 16 frozen browser pairs once and evaluates multiple strategies over those same observations.

Strategies:

1. `url-only`;
2. fingerprint v1;
3. fingerprint v2;
4. fingerprint v3;
5. fingerprint v4 with an empty volatility profile;
6. v4 without controls;
7. v4 without title;
8. v4 without query;
9. v4 plus an experimental targeted visible-content observer augmentation.

The production Playwright observer and fingerprint v4 remain unchanged.

### Frozen expected comparison

The expected aggregate metrics were committed before the Phase 18 evaluator.

| Strategy | Correct | Accuracy | False merges | False splits |
| --- | ---: | ---: | ---: | ---: |
| URL-only | 5/16 | 0.3125 | 10 | 1 |
| v1 | 13/16 | 0.8125 | 2 | 1 |
| v2 | 13/16 | 0.8125 | 3 | 0 |
| v3 | 13/16 | 0.8125 | 3 | 0 |
| v4 | 14/16 | 0.875 | 2 | 0 |
| v4 without controls | 9/16 | 0.5625 | 7 | 0 |
| v4 without title | 13/16 | 0.8125 | 3 | 0 |
| v4 without query | 13/16 | 0.8125 | 3 | 0 |
| v4 + targeted content | 16/16 | 1.0 | 0 | 0 |

The test suite also freezes the exact failed case IDs for every strategy so aggregate scores cannot hide a changed error distribution.

### URL-only baseline

The URL-only baseline uses:

- origin;
- path;
- normalized query key/value ordering.

It intentionally does not use semantic UI state.

Frozen expectation:

- 5/16 correct;
- 10 false merges;
- 1 false split.

This baseline demonstrates why URL identity alone is insufficient for modern UI state exploration.

### Historical fingerprint comparison

On the same corpus:

- v1 retains meaningful second-resolution titles but false-splits tracking noise;
- v2 removes tracking noise but falsely merges the meaningful auction timer;
- v3 keeps the same measured corpus outcome as v2 because the corpus retains the known meaningful second-resolution hazard;
- v4 restores that temporal distinction while preserving tracking-noise handling.

This provides a single-corpus summary of the earlier Phase 2-8 research history.

### Feature-removal ablations

#### Controls removed

Expected:

- 9/16 correct;
- 7 false merges.

Failures include:

- selected tab;
- expanded state;
- checkbox state;
- disabled state;
- input value;
- both content-coverage cases.

This is the largest measured ablation drop and demonstrates that semantic control state carries substantial identity information in this corpus.

#### Title removed

Expected:

- 13/16 correct;
- 3 false merges.

The newly lost case is the meaningful second-resolution auction title.

#### Query removed

Expected:

- 13/16 correct;
- 3 false merges.

The newly lost case is the semantic record-query distinction.

### Experimental targeted-content augmentation

Phase 17 showed that the current observer does not represent arbitrary meaningful paragraph/list content.

Phase 18 adds an evaluation-only observer augmentation that captures visible text from:

- `p`;
- `li`;
- `[role=status]`;
- `[role=alert]`.

Those tokens are normalized, sorted, and combined with the existing v4 canonical state only for the ablation experiment.

Frozen expectation:

- 16/16 correct;
- 0 false merges;
- 0 false splits.

The experiment must also show that the augmentation changes predictions for exactly two cases:

- `plain-status-text-state`;
- `list-content-state`.

It must not change any other Phase 17 prediction.

### Research boundary

The targeted-content result is evidence that observer coverage matters.

It is not yet a production observer change and it is not fingerprint v5.

A 16/16 score on this controlled corpus is not evidence that arbitrary body text should simply be added globally. Larger real-world pages may contain noisy timestamps, ads, counters, feeds, user-generated text, and other high-volatility content.

That trade-off must be evaluated before production adoption.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-18-baselines-ablations
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase17
npm run experiment:phase18
```

Expected suite size: 60 tests.

Expected compact Phase 18 results:

```text
url-only: 5/16, FM=10, FS=1
v1: 13/16, FM=2, FS=1
v2: 13/16, FM=3, FS=0
v3: 13/16, FM=3, FS=0
v4: 14/16, FM=2, FS=0
v4-no-controls: 9/16, FM=7, FS=0
v4-no-title: 13/16, FM=3, FS=0
v4-no-query: 13/16, FM=3, FS=0
v4-targeted-content: 16/16, FM=0, FS=0
```

The experiment writes:

- full report: `results/raw/phase-18-baselines-ablations.json`;
- compact summary: `results/raw/phase-18-baselines-ablations-summary.txt`.

### Research interpretation

A Phase 18 pass would establish a controlled comparative result rather than another isolated algorithm win.

Whole-phase verification passed on Windows x64 with Node v24.19.0.

Observed verification:

- TypeScript typecheck: passed;
- tests: 60/60 passed, 0 failed;
- frozen Phase 17 corpus result remained unchanged;
- URL-only: 5/16 correct, accuracy 0.3125, 10 false merges, 1 false split;
- v1: 13/16, accuracy 0.8125, 2 false merges, 1 false split;
- v2: 13/16, accuracy 0.8125, 3 false merges, 0 false splits;
- v3: 13/16, accuracy 0.8125, 3 false merges, 0 false splits;
- v4: 14/16, accuracy 0.875, 2 false merges, 0 false splits;
- v4 without controls: 9/16, accuracy 0.5625, 7 false merges, 0 false splits;
- v4 without title: 13/16, accuracy 0.8125, 3 false merges, 0 false splits;
- v4 without query: 13/16, accuracy 0.8125, 3 false merges, 0 false splits;
- v4 plus targeted visible content: 16/16, accuracy 1.0, 0 false merges, 0 false splits.

The exact frozen failure IDs also matched every strategy.

The targeted-content augmentation changed predictions for exactly the two Phase 17 content-coverage failures and no other corpus case.

Phase 18 therefore establishes both a historical baseline comparison and a feature-contribution ablation result on one frozen observed corpus.

Phase 18 verification gate is complete.

It would show:

- URL-only identity is severely insufficient on this corpus;
- controls are a major contributor to current semantic-state correctness;
- title and query each protect concrete semantic distinctions;
- v4 is the strongest existing fingerprint generation in the frozen comparison;
- observer coverage, not only canonicalization, is now a measured source of false merges;
- a narrowly targeted content observation can repair the two Phase 17 misses on this corpus without introducing a measured false split.

The exact targeted-content strategy remains experimental until broader and real-world evaluation.

## Phase 19 implementation

Phase 19 moves beyond controlled fixtures and evaluates StateScout against currently available public/open-source web applications.

This phase deliberately does not invent semantic ground truth for externally changing applications.

### Frozen public targets

Three public targets were selected and verified reachable during Phase 19 design:

1. TodoMVC React
   - URL: `https://todomvc.com/examples/react/dist/`
   - category: SPA/local client state;
   - purpose: hash navigation, same-page controls, and local browser state.

2. The Internet — Dynamic Controls
   - URL: `https://the-internet.herokuapp.com/dynamic_controls`
   - category: asynchronous controls;
   - purpose: async enable/remove behavior and conservative blocking of a destructive `Remove` action.

3. UI Testing Playground — Visibility
   - URL: `https://uitestingplayground.com/visibility`
   - category: visibility mutation;
   - purpose: safe UI mutation where one action changes visibility through several mechanisms.

These are external dependencies. Their availability and content are not controlled by StateScout.

### Repeated-run protocol

Each target receives:

- 3 runs;
- a fresh Chromium browser context for every run;
- v4 identity with an empty volatility profile;
- StateScout's default safe-only action policy;
- at most 6 attempted transitions per run;
- 15-second navigation timeout;
- 10-second action timeout.

Fresh browser contexts prevent local storage, cookies, and per-run client state from leaking between repeated measurements.

### Availability is not algorithm correctness

Every run first performs a network/navigation preflight.

Outcomes are separated into:

- `success`: target was reachable and StateScout completed the bounded exploration;
- `unavailable`: the external page could not be reached during preflight;
- `run-error`: the page was reachable but the exploration run itself failed.

Interaction-level failures are not promoted to run errors. They remain graph transitions with status `failed`.

This distinction prevents an external outage from being mislabeled as a StateScout failure and prevents a StateScout runtime failure from being hidden as mere site unavailability.

### Stability measurements

For successful runs the experiment records:

- initial semantic fingerprint;
- deterministic graph-structure signature;
- discovered state count;
- transition count;
- attempted-transition count;
- evidence-sidecar error count;
- observed transition count;
- policy-blocked transition count;
- failed transition count;
- no-state-change transition count;
- run duration.

Across repeated runs the target summary reports:

- availability rate;
- unique initial fingerprint count;
- unique graph-signature count;
- initial-fingerprint stability;
- graph-structure stability;
- state-count range;
- transition-count range;
- attempted-transition range.

Graph instability is valid evidence. Phase 19 does not require repeated graphs to be identical.

### Evaluability threshold

A target is evaluable for stability only when at least 2 of its 3 runs complete successfully.

The whole Phase 19 study is evaluable when at least 2 of the 3 targets are evaluable.

If fewer than 2 targets are evaluable, the experiment still writes its complete evidence report but exits non-zero so the research phase is not accepted from insufficient external evidence.

### Offline test discipline

Normal `npm test` never contacts public websites.

The offline test suite uses synthetic run records to verify:

- external unavailability is separated from stability;
- reachable run errors are separated from external outages;
- graph instability is measured independently from initial identity stability;
- insufficient successful runs produce no stability claim;
- study-level aggregation counts only explicit evaluable/stable targets.

Only `npm run experiment:phase19` performs live network access.

### Research boundary

Phase 19 is not an accuracy benchmark.

There is no manual assertion such as "this public page contains exactly N true semantic states."

Instead this phase measures:

- whether StateScout can operate on public applications under conservative policy;
- repeated-run identity stability;
- graph reproducibility;
- policy blocking;
- failed transitions;
- state-space size ranges;
- external availability.

Qualitative interpretation of the measured graphs must remain separate from controlled-corpus accuracy claims.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-19-real-world-evaluation-recovery
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase18
npm run experiment:phase19
```

Expected offline suite size: 68 tests.

There are intentionally no frozen exact graph counts for the live targets.

The key acceptance line is:

```text
Study evaluable: true
```

with at least 2/5 combined primary + recovery targets marked evaluable.

The experiment writes:

- full report: `results/raw/phase-19-real-world-evaluation.json`;
- compact summary: `results/raw/phase-19-real-world-evaluation-summary.txt`.

### Phase 19A first live result — insufficient external evidence

The first live Phase 19A run completed the offline gate successfully:

- TypeScript typecheck passed;
- tests: 65/65 passed;
- Phase 18 regression remained unchanged.

The primary public cohort produced:

- TodoMVC React: 3/3 successful runs;
- TodoMVC initial fingerprint stable across all runs;
- TodoMVC graph structure not fully stable: two graph signatures;
- TodoMVC state-count range: 5-6;
- TodoMVC transition count: 9 in every run;
- TodoMVC attempted transitions: 6 in every run;
- TodoMVC aggregate transition statuses: 17 observed, 9 blocked by policy, 1 failed, 0 no-state-change;
- The Internet Dynamic Controls: 0/3 successful because all three preflight navigations timed out at 15 seconds;
- UI Testing Playground Visibility: 0/3 successful because Chromium reported ERR_CERT_COMMON_NAME_INVALID in all three preflight navigations;
- primary evaluable targets: 1/3;
- Phase 19A study evaluable: false.

This result is retained as a failed research gate rather than hidden, reclassified, or used to relax the threshold.

The TodoMVC result remains useful empirical evidence: its initial semantic identity was stable while its bounded graph was not fully reproducible.

### Same-origin enforcement defect exposed by Phase 19

Reviewing the live-target surface exposed a safety defect before the recovery crawl:

- StateScout already had a tested core `isUrlAllowed()` same-origin policy;
- discovered links were classified through the action-risk policy;
- however, `exploreWithPlaywright()` did not consult the crawl-boundary policy before enqueueing a safe link;
- a public documentation page could therefore have caused StateScout to follow an external-origin link.

The explorer now freezes a same-origin boundary from `startUrl` at run start.

For HTTP(S) crawls:

- same-origin navigation can be enqueued;
- external-origin navigation is recorded as `blocked-by-policy`;
- non-HTTP(S) external navigation remains blocked by the existing core boundary helper.

Local `file:` benchmark fixtures may navigate only to other `file:` URLs.

A browser regression fixture contains both:

- a safe local state-changing button;
- an external `https://example.com/` link.

The regression requires the local state to remain explorable while the external link is blocked and never appears as a discovered state.

This is treated as a Phase 19 safety finding, not as a change to the identity hypothesis.

### Phase 19B pre-registered recovery cohort

Because Phase 19A failed from insufficient reachable external targets rather than StateScout run errors, a recovery cohort was selected before collecting any fallback outcomes.

The original three targets and all Phase 19A findings remain unchanged.

Recovery targets:

1. W3C ARIA APG — Automatic Tabs
   - public W3C example;
   - safe tab controls;
   - explicit selected-tab state.

2. Selenium — Web Form
   - official Selenium public fixture on a different domain;
   - form/control surface;
   - useful for conservative safe-only policy behavior.

Phase 19B reruns both the original primary cohort and the recovery cohort in one self-contained experiment.

The combined report contains:

- 3 primary targets;
- 2 recovery targets;
- 5 distinct targets total;
- 15 requested runs total.

Acceptance remains conservative:

- at least 2 successful runs are required for a target-level stability claim;
- at least 2 distinct targets across the combined primary + recovery cohorts must be evaluable;
- graph stability is not required;
- unavailable external sites do not count as StateScout run failures;
- run errors remain separate from unavailability.

The recovery targets were chosen because Phase 19A lacked enough reachable targets, not because of any observed recovery-target graph outcome.

### Research interpretation

A Phase 19 pass would establish that StateScout can be measured on public applications without conflating external availability, runtime failures, and graph instability.

Phase 19B combined live verification passed on Windows x64 with Node v24.19.0.

Observed offline verification:

- TypeScript typecheck: passed;
- tests: 68/68 passed, 0 failed;
- same-origin browser regression passed;
- frozen Phase 18 baseline/ablation result remained unchanged.

Observed live evaluation:

- primary targets/requested runs: 3/9;
- recovery targets/requested runs: 2/6;
- combined targets/requested runs: 5/15;
- successful/unavailable/run-error runs: 9/6/0;
- primary evaluable targets: 1/3;
- recovery evaluable targets: 2/2;
- combined evaluable targets: 3/5;
- minimum required evaluable targets: 2;
- study evaluable: true;
- stable initial targets: 2;
- stable graph targets: 1.

Per-target findings:

- TodoMVC React:
  - 3/3 successful;
  - initial fingerprint not stable across all three runs;
  - graph structure not stable;
  - states: 2-2;
  - transitions: 11-13;
  - attempted transitions: 1-1;
  - aggregate transition statuses: 2 observed, 34 blocked-by-policy, 1 failed, 0 no-state-change.

- The Internet Dynamic Controls:
  - 0/3 successful;
  - all three runs externally unavailable during preflight.

- UI Testing Playground Visibility:
  - 0/3 successful;
  - all three runs externally unavailable during preflight.

- W3C ARIA APG Automatic Tabs:
  - 3/3 successful;
  - initial fingerprint stable;
  - graph structure not stable;
  - states: 5-5;
  - transitions: 27-36;
  - attempted transitions: 6-6;
  - aggregate transition statuses: 14 observed, 81 blocked-by-policy, 4 failed, 0 no-state-change.

- Selenium Web Form:
  - 3/3 successful;
  - initial fingerprint stable;
  - graph structure stable;
  - states: 2-2;
  - transitions: 2-2;
  - attempted transitions: 1-1;
  - aggregate transition statuses: 3 observed, 3 blocked-by-policy, 0 failed, 0 no-state-change.

Phase 19 therefore produced sufficient external evidence without relaxing the original evaluability threshold.

The recovery cohort also showed that public-app reproducibility varies materially by target: stable initial identity does not imply stable bounded graph structure, and a conservative same-origin safe-only policy can produce a large blocked-action surface on documentation-heavy pages.

Phase 19 verification gate is complete.

The actual state/transition counts and stability outcomes become empirical Phase 19 findings rather than numbers chosen in advance.

## Phase 20 implementation

Phase 20 tests whether StateScout remains correct when exploration becomes deeper, larger, interrupted, and partially failure-prone.

This phase separates correctness thresholds from machine-dependent performance measurements.

### Checkpointable graph and frontier

`StateGraph` now supports deterministic export and validated restoration.

A graph snapshot contains:

- schema version;
- semantic states with fingerprints and original capture metadata;
- transitions with their exact IDs, statuses, interactions, destinations, and errors.

Restoration recomputes every state fingerprint with the current run fingerprinter and rejects mismatches.

`BfsFrontier` now supports deterministic export and restoration of:

- pending work in FIFO order;
- the full seen `(state, interaction)` work set.

Preserving the seen set matters because restoring only pending items would allow already-consumed interactions to be scheduled again after a crash.

### Exploration checkpoint artifact

A Phase 20 checkpoint contains:

- start URL;
- attempted-transition count;
- root replay path;
- graph snapshot;
- frontier snapshot;
- accumulated evidence-sidecar errors.

The payload is wrapped in a SHA-256 digest.

Serialized corruption must therefore be detected before resume.

A checkpoint is a logical exploration snapshot, not a browser-process snapshot.

StateScout still restores each pending source state through deterministic replay when exploration resumes.

### Playwright resume

`exploreWithPlaywright()` now accepts a checkpoint from a previous bounded run.

On resume:

1. start URL must match the checkpoint;
2. stored states are revalidated with the current run fingerprinter;
3. graph and BFS frontier are restored;
4. attempted-transition accounting continues from the stored value;
5. already-seen work remains deduplicated;
6. the next pending source state is restored through the existing replay mechanism.

The final result always exposes a fresh checkpoint artifact.

An optional checkpoint sink can persist intermediate checkpoints after transition attempts.

### Browser deep-replay benchmark

The frozen browser fixture is a linear same-document workflow:

```text
Depth 0
  -> Depth 1
  -> ...
  -> Depth 32
```

Frozen correctness:

- depth: 32;
- states: 33;
- transitions: 32;
- attempted transitions: 32;
- failed transitions: 0;
- replay-step observations: 496;
- restored-source observations: 32;
- after-interaction observations: 32.

The 496 replay-step count is the exact sum of replay depths:

```text
0 + 1 + 2 + ... + 31 = 496
```

This intentionally exposes the cost of replay-based restoration rather than hiding it.

### Browser interruption and resume

The browser benchmark also runs:

1. uninterrupted to 32 attempts;
2. interrupted after 10 attempts;
3. checkpoint serialized and parsed;
4. exploration resumed in a fresh Playwright page;
5. resumed run continued to 32 total attempts.

The resumed graph must have the same canonical state/transition signature as the uninterrupted graph.

### Synthetic scale benchmark

A browser-independent deterministic state machine measures larger graph sizes without making the test suite spend tens of thousands of browser replay clicks.

Frozen scale points:

| States | Observed transitions | Injected failed probes | Total transitions / attempts |
| ---: | ---: | ---: | ---: |
| 64 | 63 | 4 | 67 |
| 128 | 127 | 8 | 135 |
| 256 | 255 | 16 | 271 |

The main `Advance` interaction produces the next semantic state.

Every 16th state also exposes a deterministic safe probe whose execution is intentionally recorded as a failed transition.

These failures do not block discovery of the main state chain.

### Synthetic checkpoint recovery

The 256-state run is executed in two ways:

1. uninterrupted to completion;
2. stopped after 100 attempts, serialized, parsed, then resumed.

Frozen final correctness:

- attempts: 271;
- states: 256;
- transitions: 271;
- failed transitions: 16;
- resumed canonical graph signature equals uninterrupted signature;
- corrupted serialized checkpoint is rejected.

### Performance measurements

Phase 20 records, but does not freeze as correctness thresholds:

- duration for 64 / 128 / 256-state synthetic runs;
- heap delta for each scale point;
- browser deep-replay duration;
- browser heap delta;
- serialized checkpoint sizes.

These values depend on OS, Node/V8 state, hardware, process scheduling, and garbage collection.

They are evidence for later scalability analysis, not a reason to tune the benchmark until a particular laptop passes an arbitrary millisecond threshold.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-20-scalability-recovery
git pull --ff-only
npm install
npx playwright install chromium

npm run typecheck
npm test
npm run experiment:phase18
npm run experiment:phase20
```

Expected offline suite size: 75 tests.

Expected Phase 20 correctness summary:

```text
Synthetic 64: transitions=67, attempts=67, failed=4
Synthetic 128: transitions=135, attempts=135, failed=8
Synthetic 256: transitions=271, attempts=271, failed=16

Synthetic checkpoint interrupt/final attempts: 100/271
Synthetic resumed states/transitions/failed: 256/271/16
Synthetic resumed matches uninterrupted: true
Corrupted checkpoint rejected: true

Browser deep replay states/transitions/attempts: 33/32/32
Browser replay-step/restored/after observations: 496/32/32
Browser checkpoint interrupt/final attempts: 10/32
Browser resumed matches uninterrupted: true
```

Durations, heap deltas, and checkpoint byte counts are expected to vary and should be reported exactly as observed.

The experiment writes:

- `results/raw/phase-20-scalability-recovery.json`;
- `results/raw/phase-20-scalability-recovery-summary.txt`.

### Research interpretation

Phase 20 whole-phase verification passed on Windows x64 with Node v24.19.0 after one TypeScript immutability fix in graph snapshot sorting.

Observed verification:

- TypeScript typecheck: passed;
- tests: 75/75 passed, 0 failed;
- Phase 20 browser deep-replay test passed;
- Phase 20 browser checkpoint-resume test passed;
- Phase 20 synthetic 64/128/256-state correctness tests passed;
- checkpoint corruption detection passed.

Measured synthetic results:

- 64 states: 67 transitions, 67 attempts, 4 injected failures, 17.699 ms, heap delta 914176 bytes;
- 128 states: 135 transitions, 135 attempts, 8 injected failures, 4.761 ms, heap delta 1737152 bytes;
- 256 states: 271 transitions, 271 attempts, 16 injected failures, 9.397 ms, heap delta 3910544 bytes.

Synthetic checkpoint recovery:

- interrupted after 100 attempts;
- resumed to 271 attempts;
- final states/transitions/failed: 256/271/16;
- checkpoint size: 260141 bytes;
- resumed graph matched uninterrupted graph: true;
- corrupted checkpoint rejected: true.

Browser deep-replay measurement:

- states/transitions/attempts: 33/32/32;
- replay-step/restored-source/after-interaction observations: 496/32/32;
- duration: 22655.856 ms;
- heap delta: 30665168 bytes;
- checkpoint interrupted after 10 attempts and resumed to 32;
- browser checkpoint size: 34747 bytes;
- resumed graph matched uninterrupted graph: true.

The synthetic timings are intentionally treated as noisy single-run measurements rather than monotonic scaling evidence. The correctness counts and resume equivalence are the frozen acceptance criteria.

Phase 20 verification gate is complete.

A Phase 20 pass would establish that:

- StateScout can serialize and validate its logical exploration state;
- already-consumed work remains deduplicated after resume;
- browser exploration can stop and resume without changing the final controlled graph;
- hundreds of deterministic semantic states can be processed with injected failed interactions while maintaining complete state coverage;
- corrupted checkpoints fail closed instead of silently resuming from modified state;
- replay cost grows visibly with path depth and is therefore a measured scalability concern rather than an undocumented implementation detail.

Phase 20 does not yet claim optimal scaling or crash-safe database durability. Checkpoints are JSON-compatible in-memory artifacts; durable atomic storage and distributed execution remain future engineering work.

## Phase 21 implementation

Phase 21 freezes the research implementation and turns the verified Phase 0-20 work into a reproducible paper artifact.

No new semantic-identity algorithm is introduced in this phase.

### Freeze baseline

The research implementation is frozen at:

```text
d4aa27d4e2516555a30741f9829785b0db12316e
```

This is the Phase 20 squash merge on `main`.

The machine-readable manifest is:

```text
research/freeze-manifest.json
```

It protects the exact Git tree identities of:

- `src/`;
- `benchmarks/`;
- `tests/`.

Those trees contain the algorithms, frozen evaluation artifacts, and accepted correctness suite.

### Machine-checkable freeze

`npm run experiment:phase21` verifies:

1. the freeze commit is an ancestor of the current checkout;
2. the current `src/` tree matches the frozen tree;
3. the current `benchmarks/` tree matches the frozen tree;
4. the current `tests/` tree matches the frozen tree.

Expected result:

```text
src: MATCH
benchmarks: MATCH
tests: MATCH
Research freeze intact: true
```

A later documentation/reporting commit may therefore evolve without silently changing the measured system.

### Allowed post-freeze work

Allowed:

- paper writing;
- result-table/figure generation;
- related-work updates;
- citation updates;
- reproducibility documentation;
- non-algorithmic reporting scripts;
- release packaging.

Protected algorithm/benchmark/test changes require a documented correctness or ground-truth defect, a new freeze baseline, and rerunning every materially affected experiment.

### Consolidated research package

Added:

- `docs/RESEARCH_FREEZE.md` — freeze/change policy;
- `docs/RESULTS_SUMMARY.md` — verified results through Phase 20;
- `docs/THREATS_TO_VALIDITY.md` — internal, construct, external, statistical, safety, and reproducibility limitations;
- `docs/REPRODUCIBILITY.md` — artifact setup and rerun protocol;
- `docs/PAPER_OUTLINE.md` — working title, research questions, contributions, method/results structure, and conservative conclusion direction.

The README now points reviewers directly to these research artifacts.

### Reproduction commands

Fast frozen-artifact gate:

```powershell
npm run typecheck
npm test
npm run experiment:phase21
```

Complete controlled/local reproduction:

```powershell
npm run research:reproduce-controlled
```

The controlled command reruns the strict typecheck, complete 75-test suite, Phases 8-18, Phase 20, and the freeze verifier.

Phase 19 remains separate:

```powershell
npm run research:rerun-real-world
```

This prevents changing public-site availability from making the deterministic artifact appear irreproducible.

### Paper framing

The current paper framing centers on five research questions:

1. how semantic state identity compares with URL-only and earlier fingerprint strategies;
2. whether dynamic fields can be abstracted contextually without unsafe global normalization;
3. whether learned abstraction can be challenged, revoked, and historically reversed;
4. whether learned rules can be selectively revalidated under a bounded verification budget;
5. whether semantic exploration remains safe and recoverable under public-site variability, deep replay, interruption, and failed interactions.

The paper must distinguish:

- controlled correctness;
- ablation results;
- real-world observational stability;
- scalability/recovery measurements.

It must not present public-site graph size as oracle-backed coverage.

### Whole-phase verification gate

```powershell
git fetch origin
git switch feat/phase-21-research-freeze-paper-artifact
git pull --ff-only
npm install

npm run typecheck
npm test
npm run experiment:phase21
```

Expected suite size remains:

```text
75 tests
75 pass
0 fail
```

Expected freeze result:

```text
src: MATCH
benchmarks: MATCH
tests: MATCH
Research freeze intact: true
```

This gate intentionally does not rerun public websites.

### Research interpretation

A Phase 21 pass means StateScout has transitioned from active algorithm development into a frozen research artifact suitable for paper drafting and reproducible review.

Whole-phase verification passed on 2026-10-08.

Observed Phase 21 gate:

- TypeScript typecheck: passed;
- tests: 75/75 passed, 0 failed;
- frozen `src/` tree: MATCH;
- frozen `benchmarks/` tree: MATCH;
- frozen `tests/` tree: MATCH;
- frozen verified suite: 75/75 passed;
- research freeze intact: true.

A separate public-site replication was also run after the freeze.

That replication remained evaluable with 3/5 targets, but stability changed relative to the original accepted Phase 19 run:

- TodoMVC changed from unstable initial/graph behavior to stable initial/graph behavior;
- W3C APG remained initial-stable but graph-unstable;
- Selenium remained initial-stable and graph-stable;
- The Internet and UI Testing Playground remained externally unavailable;
- StateScout run-level errors remained zero.

The replication is recorded in `docs/REAL_WORLD_REPLICATIONS.md` and does not replace the original Phase 19 evidence.

Phase 21 verification gate is complete.

Passing Phase 21 does not mean the paper is automatically publication-ready. The remaining scholarly work includes:

- final literature review and novelty positioning;
- final controlled reproduction run for archived result tables;
- figures;
- manuscript drafting;
- venue selection and formatting;
- independent review where possible.

## After Phase 21

Do not start Phase 22 algorithm work by default.

The default next work should be the manuscript/reproducibility release built from the frozen artifact.

Future product features may continue on a separate post-paper roadmap without being mixed into the frozen experimental claims.

## Merge status

Phases 1A through 20 are merged. Phase 21 research-freeze and paper-artifact packaging is verified on `feat/phase-21-research-freeze-paper-artifact`; PR #23 is ready for merge.
