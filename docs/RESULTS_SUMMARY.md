# StateScout Consolidated Results

## Purpose

This document consolidates the main verified research findings through Phase 20.

It is a paper-facing summary, not a replacement for the detailed chronological evidence in `docs/PROJECT_STATE.md`.

## 1. Semantic identity evolution

### Early equivalence benchmark

The original v1 semantic fingerprint scored:

```text
7/9 correct
false merges: 0
false splits: 2
```

The two false splits were tracking-query noise and timestamp-title noise.

Fingerprint v2 normalized those measured noise sources and reached:

```text
9/9 correct
false merges: 0
false splits: 0
```

### Adversarial evaluation

A later frozen adversarial benchmark showed the cost of aggressive normalization.

v2:

```text
4/6 correct
false merges: 2
false splits: 0
```

The false merges were:

- a semantic `ref` query value;
- a meaningful minute-resolution title time.

v3 repaired those measured hazards and reached 6/6 on the adversarial benchmark.

### Broader generalization

The Phase 8 ten-pair benchmark produced:

| Fingerprint | Correct | False merges | False splits |
| --- | ---: | ---: | ---: |
| v1 | 8/10 | 0 | 2 |
| v2 | 7/10 | 3 | 0 |
| v3 | 9/10 | 1 | 0 |

The remaining v3 false merge was a meaningful second-resolution title value.

This demonstrated that the same syntactic pattern can be volatile in one semantic context and meaningful in another.

## 2. Observed-volatility abstraction

Phase 9 replaced global regex-style volatility assumptions with anchor-scoped learned volatility.

On the six-pair held-out benchmark:

| Strategy | Correct | False merges | False splits |
| --- | ---: | ---: | ---: |
| v1 | 3/6 | 0 | 3 |
| v2 | 2/6 | 2 | 2 |
| v3 | 3/6 | 1 | 2 |
| v4 + trusted scoped profile | 6/6 | 0 | 0 |

The key result is contextual rather than syntactic: volatility is trusted only for a specific protected semantic anchor.

## 3. Candidate quarantine and offline promotion

Phase 10 separated candidate discovery from trust.

The controlled Dashboard candidate:

- varied across sessions;
- preserved a stable protected anchor;
- produced one downstream behavior signature;
- became eligible for promotion.

The controlled Auction candidate:

- had superficially similar value variation;
- produced divergent downstream behavior;
- remained ineligible.

Phase 11 then proved that browser evidence collection can occur without changing the identity function of the run that collected the evidence.

Phase 12 moved promotion fully offline between runs. The future empty-profile run retained volatile-state inflation, while the future promoted-profile run collapsed only the verified volatility.

## 4. Defeasible trust

Phase 13 demonstrated that trusted abstraction can become wrong after application behavior changes.

With stale trust:

```text
coverage: 0.5
states: 2
transitions: 3
attempts: 3
```

After offline revocation:

```text
coverage: 1.0
states: 6
transitions: 6
attempts: 6
failed transitions: 0
```

Phase 14 extended this into a freshness-aware lifecycle:

```text
trusted
  -> challenged
  -> trusted

trusted
  -> challenged
  -> revoked
  -> cooldown
  -> trusted
```

A challenged rule is already excluded from the next active profile, restoring conservative coverage before permanent revocation.

## 5. Selective revalidation

Phase 15 evaluated four independent rules under a verification budget of two.

Frozen priority ranking:

```text
150 > 84 > 80 > 11
```

Selected:

- challenged high-impact rule;
- aging trusted rule.

Result:

```text
selected fraction: 0.5
saved scheduling units: 2
unrelated lifecycle states preserved: true
```

The scoring policy is a candidate heuristic, not an optimal scheduler.

## 6. Reversible abstraction

Phase 16 preserved immutable raw observations and transitions beneath the active abstraction layer.

Raw archive:

```text
6 observations
7 transitions
```

Trusted projection:

```text
3 states
6 transitions
4 Dashboard observations aliased
```

After rule revocation:

```text
6 states
7 transitions
4 historical Dashboard states recovered
```

After trust restoration:

```text
3 states
6 transitions
```

The raw archive digest remained unchanged across every projection.

This means abstraction can be revised without erasing the historical observations it compressed.

## 7. Broader corpus and ablation study

Phase 17 froze 16 semantic-equivalence pairs across seven families.

Current v4 with an empty profile:

```text
14/16 correct
false merges: 2
false splits: 0
```

Both failures were meaningful visible content outside the production observer:

- plain status text;
- list content.

Phase 18 compared nine strategies on the exact same corpus:

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
| v4 + targeted visible content | 16/16 | 1.0 | 0 | 0 |

Important interpretation:

- URL identity alone is severely insufficient;
- semantic control state is a major contributor;
- title and query each protect real distinctions;
- observer coverage is now a measured source of false merges;
- the 16/16 targeted-content result is experimental and does not justify globally fingerprinting arbitrary body text.

## 8. Real-world repeated-run evaluation

Phase 19 intentionally separated public-site availability from StateScout failures.

Combined primary + recovery cohort:

```text
targets: 5
requested runs: 15
successful runs: 9
unavailable runs: 6
run-error runs: 0
evaluable targets: 3/5
minimum required: 2
study evaluable: true
```

Per-target stability:

| Target | Successful runs | Initial identity stable | Graph stable |
| --- | ---: | --- | --- |
| TodoMVC React | 3/3 | no | no |
| The Internet Dynamic Controls | 0/3 | not evaluable | not evaluable |
| UI Testing Playground Visibility | 0/3 | not evaluable | not evaluable |
| W3C APG Automatic Tabs | 3/3 | yes | no |
| Selenium Web Form | 3/3 | yes | yes |

The study therefore observed three materially different behaviors:

- unstable initial identity and unstable graph;
- stable initial identity but unstable graph;
- stable initial identity and stable graph.

Phase 19 also exposed and fixed a real safety defect: the Playwright explorer had not been enforcing the already-defined same-origin boundary before enqueueing discovered links.

## 9. Scalability and recovery

Phase 20 froze synthetic scale points:

| States | Transitions | Attempts | Injected failures |
| ---: | ---: | ---: | ---: |
| 64 | 67 | 67 | 4 |
| 128 | 135 | 135 | 8 |
| 256 | 271 | 271 | 16 |

Checkpoint recovery on the 256-state run:

```text
interrupt: 100 attempts
final: 271 attempts
final states: 256
final transitions: 271
final failed transitions: 16
resumed graph == uninterrupted graph: true
corrupted checkpoint rejected: true
checkpoint size: 260141 bytes
```

Browser deep-replay benchmark:

```text
depth: 32
states: 33
transitions: 32
attempts: 32
replay-step observations: 496
restored-source observations: 32
after-interaction observations: 32
```

Final measured run:

```text
browser duration: 22655.856 ms
browser heap delta: 30665168 bytes
browser checkpoint size: 34747 bytes
resume interrupt/final attempts: 10/32
resumed graph == uninterrupted graph: true
```

The synthetic single-run timings were non-monotonic, so they are retained as measurements rather than used to claim a timing complexity curve.

The browser replay count is structural evidence of replay cost: for a linear depth-32 workflow the explorer performed 496 replay-step observations.

## 10. Final freeze state

At the Phase 20 freeze point:

```text
TypeScript: passed
tests: 75/75
research freeze base:
d4aa27d4e2516555a30741f9829785b0db12316e
```

No further algorithm or benchmark tuning should occur during paper preparation unless a documented correctness defect is discovered.
