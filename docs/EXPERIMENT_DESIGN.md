# Experiment Design

## Purpose

This document converts the research questions into measurable experiments.

No metric values should be manually invented. Final paper tables and figures should be generated from captured experiment outputs.

---

## Experiment E1 — Semantic state equivalence

Supports: RQ1.

### Systems under comparison

- URL-only identity
- normalized DOM identity
- StateScout semantic identity

### Dataset

Controlled benchmark applications containing known state pairs such as:

- same URL, different dialog
- same URL, different active tab
- same workflow state with timestamp changes
- same semantic state with random CSS classes
- same semantic state with extra wrapper elements
- similar pages that must remain distinct
- visually similar pages with different interactive affordances

### Metrics

- precision for state equivalence
- recall for state equivalence
- false merge rate
- false split rate
- F1 score
- fingerprint computation cost

### Ground truth

Each state pair must be labeled before algorithm evaluation.

---

## Experiment E2 — Exploration coverage

Supports: RQ2.

### Compare

- baseline crawler
- semantic StateScout crawler
- external tools where fair/reproducible

### Metrics

- distinct ground-truth states reached
- ground-truth transitions reached
- complete workflows reached
- duplicate executions
- total actions
- wall-clock time
- crashes/timeouts

### Important normalization

A tool must not win merely because it reports more noisy states.

Coverage should use labeled/validated meaningful states where possible.

---

## Experiment E3 — Locator robustness

Supports: RQ3.

### Base applications

Create UI fixtures whose user-visible behavior stays constant while implementation details change.

### Mutation operators

Examples:

- insert wrapper elements
- change DOM nesting
- rename CSS classes
- reorder sibling containers where semantics stay equivalent
- migrate native markup to an accessible custom component
- change CSS framework
- rerender component tree
- change non-user-visible attributes
- alter generated IDs

### Locator strategies

Candidate comparison:

- structural CSS
- XPath
- test ID
- semantic role + accessible name
- label
- StateScout ranked locator resolver

### Metrics

- successful relocation rate
- correct-target rate
- ambiguity rate
- execution latency

---

## Experiment E4 — Graph deduplication and cycles

Supports: RQ2/RQ4-adjacent architecture validation.

Construct applications with:

- multiple paths to same state
- back navigation
- nested modal cycles
- tab loops
- route aliases

Measure:

- duplicate state creation
- repeated transition execution
- missed reachable states
- termination behavior

---

## Experiment E5 — Safety policy

Engineering and research-supporting evaluation.

Construct explicit actions labeled:

- safe/read-only
- mutating
- destructive

Examples:

- open menu
- open dialog
- change tab
- create temporary entity
- delete entity
- logout
- publish
- payment-like confirmation

Measure:

- unsafe execution rate
- safe-action false block rate
- classification coverage

The initial implementation may use deterministic rules only.

---

## Experiment E6 — AI fallback (later)

Do not block the first paper on this experiment.

Evaluate only after the deterministic system is stable.

Potential metrics:

- additional meaningful state coverage
- additional workflow coverage
- token cost
- latency
- run-to-run variance
- wrong-target interaction rate

---

## Repetition and reproducibility

For nondeterministic experiments:

- define a fixed number of runs;
- record seeds where controllable;
- record browser/runtime versions;
- record machine/environment metadata;
- store raw per-run results.

## Statistical analysis

Choose tests after inspecting the measurement scale and distributions.

Do not select a statistical test only because it produces significance.

Report:

- effect sizes
- confidence intervals
- raw/summary distributions
- sample sizes
- exclusions and failures

## Threats to validity

Track at least:

### Construct validity

Does the chosen fingerprint/metric represent a meaningful user-visible state?

### Internal validity

Are browser timing, animation, async requests, random data, and test order affecting results?

### External validity

Do benchmark applications represent real modern web applications?

### Conclusion validity

Are there enough applications/runs to support the claims?

## Output contract

Experiments should eventually follow a structure such as:

```text
experiments/
├── rq1-state-equivalence/
├── rq2-exploration/
├── rq3-locator-robustness/
└── safety/

results/
├── raw/
├── processed/
└── figures/
```

Paper figures should be generated from `results/`, never manually recreated from memory.
