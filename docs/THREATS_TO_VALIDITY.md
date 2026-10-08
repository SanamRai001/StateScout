# Threats to Validity

## Purpose

StateScout is an experimental software-testing artifact developed iteratively alongside its benchmarks.

This document records limitations that should be stated directly in a paper rather than hidden behind aggregate scores.

## Internal validity

### Researcher-designed fixtures

Most controlled benchmarks were designed by the same researcher who implemented StateScout.

This creates a risk of unconscious benchmark alignment.

Mitigations used in the project:

- ground truth was repeatedly frozen before implementation or tuning;
- negative results were retained;
- v2 false merges were documented rather than patched out of the benchmark;
- Phase 17 intentionally included observer-blind cases;
- Phase 19A's insufficient-evidence outcome was preserved;
- Phase 21 freezes algorithms, benchmarks, and tests before paper writing.

This reduces but does not eliminate researcher bias.

### Iterative hypothesis formation

Several research questions emerged after earlier results.

The project is therefore not a fully preregistered study from Phase 0.

Claims should distinguish:

- hypotheses frozen before a specific phase;
- exploratory findings that motivated later phases;
- confirmatory reruns on frozen benchmarks.

### Harness defects

The project found several harness/engineering defects during evaluation, including:

- same-document fixture reset behavior;
- a same-document replay reset bug in the explorer;
- a missing browser-level same-origin enforcement path;
- a readonly-array TypeScript snapshot-sorting defect.

These were fixed without changing the associated frozen semantic ground truth.

The paper should explicitly distinguish harness corrections from algorithm tuning.

## Construct validity

### Semantic-state definition

StateScout observes a deliberately limited semantic snapshot:

- origin/path/query;
- title;
- headings;
- landmarks;
- dialogs;
- semantic controls and selected control state.

It does not currently model all user-visible or behaviorally meaningful page information.

Phase 17 showed two false merges caused by ordinary status/list content outside the observer.

Therefore "semantic state" in the paper must mean the operational StateScout representation, not a complete formal model of every meaningful browser state.

### Behavioral equivalence evidence

Stable downstream behavior signatures provide evidence that a volatile field can be abstracted, but they are not mathematical proof of semantic equivalence.

A safe-probe set may miss behavior that requires:

- longer workflows;
- particular data;
- authentication;
- asynchronous timing;
- non-click interactions;
- destructive/mutating actions that StateScout intentionally refuses to perform.

### Coverage metric

Controlled fixtures can define reachable-state coverage because their ground truth is known.

Public applications do not have a complete oracle.

Phase 19 therefore reports repeated-run stability and bounded graph observations rather than claiming real-world coverage percentages.

## External validity

### Limited real-world sample

Phase 19 used five named public targets, of which only three were evaluable in the final combined run.

Two primary targets were unavailable from the measurement environment.

The real-world study is evidence of feasibility and variability, not proof of behavior across the web.

### Public-site drift

External applications may change after the recorded experiment.

Future reruns may produce different:

- DOM structure;
- accessibility names;
- state graphs;
- availability;
- certificates;
- latency.

Original Phase 19 results must remain timestamped evidence rather than being silently replaced by newer runs.

### Application classes not covered

The current study is weak or absent for:

- authenticated enterprise applications;
- canvas/WebGL-heavy interfaces;
- mobile-native interfaces;
- complex rich-text editors;
- highly personalized feeds;
- multi-user real-time collaboration;
- payment/commerce workflows requiring mutating actions;
- applications requiring large form-input spaces.

## Statistical conclusion validity

### Small benchmark sizes

Several controlled phases use small purpose-built pair sets.

The strong results are useful for falsifying specific hypotheses and comparing known alternatives, but they do not support broad population-level statistical claims.

### Performance timing

Phase 20 performance data are single-run measurements on one machine/environment.

Synthetic timings were non-monotonic across 64/128/256 states, demonstrating startup/JIT/GC noise.

The paper should not fit or claim an empirical asymptotic runtime curve from those three timings.

The structural replay count is more reliable: a linear depth-32 workflow produced 496 replay-step observations.

### No confidence intervals

The controlled correctness benchmarks are deterministic and report exact counts.

The project does not currently report confidence intervals for real-world timing or stability rates.

## Safety-policy validity

The safe-only policy is intentionally conservative.

This can create:

- false blocks of harmless controls whose names resemble destructive concepts;
- lower observed real-world action coverage;
- incomplete exploration of forms requiring mutating submissions.

That conservatism is part of the safety design, but it also affects measured graph size.

## Fingerprint-version comparison

v1-v4 were developed sequentially.

Later versions were informed by earlier failures, so the comparison is not a blind competition among independently designed algorithms.

The scientifically useful claim is evolutionary:

- specific frozen counterexamples falsified earlier assumptions;
- later designs repaired measured failure classes;
- broader benchmarks were then added to search for new failures.

## Learned-volatility generalization

Anchor-scoped volatility reduced measured false merges/splits in the controlled setting.

However:

- candidate evidence sets are small;
- application/version scope is externally supplied;
- estimated revalidation coverage impact is currently metadata, not automatically inferred;
- selective-revalidation weights are a transparent candidate heuristic rather than an optimized policy.

## Checkpoint durability

Phase 20 proves logical checkpoint serialization, digest verification, and resume equivalence.

It does not prove:

- atomic crash-safe file writes;
- database durability;
- power-loss recovery;
- distributed worker recovery;
- Byzantine/adversarial checkpoint integrity.

The SHA-256 digest detects accidental or manual payload modification but is not an authenticated signature.

## Reproducibility boundary

The deterministic controlled suite is the primary reproducible artifact.

Phase 19 is intentionally separated because network conditions and third-party sites are external dependencies.

A successful reproduction should not be declared failed solely because a public target is temporarily unavailable.
