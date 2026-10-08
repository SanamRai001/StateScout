# StateScout Paper Outline

## Working title

**StateScout: Semantic State-Space Exploration for Modern Web Interfaces Under Bounded Safe Interaction**

Alternative:

**Beyond URLs: Adaptive Semantic State Identity for Reproducible Web UI Exploration**

## Central problem

Modern web applications expose many distinct interactive states without changing URL.

At the same time, dynamic implementation noise can make equivalent states appear different.

A crawler therefore faces two opposing errors:

- false split — one semantic state represented as several states;
- false merge — meaningfully different states collapsed into one state.

False merges are especially dangerous because a merged state can hide an entire reachable subtree.

## Proposed thesis

A practical web state explorer can reduce both forms of identity error by combining:

1. semantic browser observations rather than URL identity;
2. contextual, evidence-backed volatility abstraction;
3. defeasible trust that can be challenged and revoked;
4. immutable raw observations beneath reversible equivalence projections;
5. conservative safe exploration and deterministic replay;
6. persistent checkpoint/resume for robust bounded exploration.

The paper should present this as evidence from one research artifact, not as a universal proof that the problem is solved.

## Research questions

### RQ1 — State identity

How accurately do URL identity and progressively richer semantic fingerprints distinguish equivalent from meaningfully different modern web UI states?

Primary evidence:

- Phases 2-9;
- Phase 17 corpus;
- Phase 18 baseline/ablation comparison.

### RQ2 — Adaptive abstraction

Can dynamic fields be abstracted without globally normalizing patterns that may be semantically meaningful elsewhere?

Primary evidence:

- observed volatility;
- protected semantic anchors;
- candidate quarantine;
- safe-probe behavior evidence;
- offline promotion;
- revalidation and trust lifecycle.

### RQ3 — Defeasibility and historical reversibility

When an abstraction later becomes invalid, can StateScout stop trusting it and recover historical distinctions without destroying the evidence that produced the earlier abstraction?

Primary evidence:

- Phase 13 revocation;
- Phase 14 lifecycle;
- Phase 16 reversible raw archive.

### RQ4 — Bounded verification

Can multiple learned rules be prioritized for revalidation under a fixed verification budget?

Primary evidence:

- Phase 15 four-rule scheduling benchmark.

### RQ5 — Operational robustness

Can the exploration process remain safe and recoverable under deep replay, failed interactions, interruption, and public-site variability?

Primary evidence:

- Phase 19 same-origin safety finding and repeated-run study;
- Phase 20 checkpoint/resume and scale benchmark.

## Candidate contributions

### C1. Semantic state graph exploration

A browser-independent state graph where identity is semantic rather than URL-only and the BFS frontier stores `(state, interaction)` work.

### C2. Contextual volatility abstraction

A learned volatility mechanism scoped to protected semantic anchors rather than global syntax patterns.

### C3. Defeasible abstraction lifecycle

Candidate quarantine, behavior-backed promotion, freshness/challenge/revocation/recovery, and selective revalidation.

### C4. Reversible equivalence

Immutable raw observations/transitions underneath derived alias projections so later revocation can reinterpret history.

### C5. Safety and recovery

Same-origin, safe-only exploration plus digest-verified logical checkpoints that resume to the same controlled graph as uninterrupted exploration.

## Methodology section

Suggested structure:

1. system model;
2. semantic snapshot representation;
3. fingerprint versions and failure-driven evolution;
4. volatility evidence model;
5. trust lifecycle;
6. reversible archive;
7. exploration/replay/safety policy;
8. checkpoint/recovery;
9. experimental protocol.

Clearly separate:

- controlled correctness benchmarks;
- ablation experiments;
- live/public-site observational evaluation;
- scalability/recovery measurements.

## Results section

### Result A — URL-only is insufficient

Phase 18 URL-only:

```text
5/16 correct
10 false merges
1 false split
```

### Result B — Current frozen v4 is stronger but not complete

```text
14/16 correct
2 false merges
0 false splits
```

Both false merges are observer-coverage failures.

### Result C — Controls materially contribute to state identity

Removing controls:

```text
9/16 correct
7 false merges
```

### Result D — Targeted content closes the controlled corpus gap

Experimental targeted content:

```text
16/16
0 false merges
0 false splits
```

Do not present this as the final production observer.

### Result E — Contextual learned volatility solves measured syntax ambiguity

Phase 9 v4 + trusted scoped profile:

```text
6/6
0 false merges
0 false splits
```

while earlier global-style normalizations produced measured false merges.

### Result F — Trust must be defeasible

Stale abstraction reduced controlled coverage to 0.5; revocation restored full coverage.

### Result G — Abstraction can be reversible

One immutable six-observation archive can project to:

```text
trusted: 3 states
revoked: 6 states
restored: 3 states
```

without changing the raw archive digest.

### Result H — Public application behavior is variable

Final Phase 19:

```text
3/5 targets evaluable
2 targets stable initial identity
1 target stable graph
0 StateScout run-level errors
```

### Result I — Logical recovery preserves the controlled graph

Phase 20:

```text
256-state interrupted/resumed graph
==
256-state uninterrupted graph
```

and browser deep replay also converged after resume.

## Discussion

Topics to discuss:

- why false merges are more dangerous than false splits;
- why "dynamic-looking" syntax is not enough evidence for normalization;
- why evidence should affect future runs, not mutate the current run;
- why abstraction must be defeasible;
- why raw evidence should survive abstraction;
- the cost of replay-based restoration;
- safety/coverage trade-offs from conservative policy;
- observer completeness versus volatility noise.

## Threats to validity

Use `docs/THREATS_TO_VALIDITY.md` directly as the source.

Major points:

- researcher-designed controlled fixtures;
- small benchmark sets;
- limited real-world target count;
- third-party site drift;
- no universal real-world coverage oracle;
- observer excludes some visible content;
- performance timings are single-machine measurements;
- later fingerprint versions were informed by earlier failures.

## Related work

The final related-work pass should compare StateScout carefully against:

- model-based web crawling;
- GUI ripping;
- state abstraction in model-based testing;
- DOM/state equivalence heuristics;
- Playwright/Selenium crawlers;
- web testing agents;
- state merging and abstraction refinement;
- active learning / conformance testing where relevant.

Do not claim novelty until the final literature comparison is complete.

## Artifact section

Describe:

- public repository;
- frozen commit;
- freeze manifest;
- deterministic controlled suite;
- separate external study;
- reproduction commands;
- generated raw JSON summaries;
- hardware/runtime disclosure.

## Conclusion direction

The conclusion should be narrow:

StateScout's experiments show that semantic state-space exploration benefits from contextual and reversible abstraction rather than URL identity or global noise normalization alone. The artifact also demonstrates that learned equivalence can be challenged, revoked, selectively revalidated, and resumed after interruption while preserving evidence.

Do not conclude that StateScout fully solves arbitrary web crawling or semantic equivalence.
