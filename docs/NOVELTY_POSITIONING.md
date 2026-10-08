# StateScout Novelty Positioning Matrix

## Purpose

This matrix translates the final related-work review into concrete paper-claim rules.

It is intentionally conservative.

Legend:

- **PRIOR** — clearly established; do not claim novelty.
- **ADJACENT** — related prior work exists; contribution is only in a narrower formulation or combination.
- **CANDIDATE** — no directly comparable mechanism found in the reviewed literature; claim with "to our knowledge/in the reviewed literature" wording.
- **SUPPORTING** — valuable artifact/system property, but not currently the central novelty claim.

| StateScout concept | Status | Closest prior work | Safe paper position |
| --- | --- | --- | --- |
| State-flow graph for dynamic web UI | PRIOR | Crawljax; GUI event-flow models | Foundational architecture only |
| One URL can contain many UI states | PRIOR | Crawljax/AJAX crawling | Motivation, not novelty |
| Browser-driven automatic exploration | PRIOR | Crawljax, WebMate, ARTEMIS, TESTAR | Engineering substrate |
| BFS/graph traversal | PRIOR | Broad model-based testing literature | Implementation choice |
| Replay path to restore state | PRIOR | Crawljax/WebMate-style crawling/testing | Supporting mechanism |
| DOM/state near-duplicate abstraction | PRIOR | Crawljax, MinHash, FragGen, WebEmbed, Judge | Do not claim novelty |
| Learned state-equivalence classifier | PRIOR | WebEmbed, Judge | Do not claim novelty |
| Fragment-based state abstraction | PRIOR | FragGen | Contrast only |
| Accessibility semantic observation | PRIOR/ADJACENT | WebArena, BrowserGym, modern automation | Feature choice, not core novelty |
| Semantic controls in state identity | ADJACENT | accessibility observations; GUI abstraction work | Empirical feature contribution |
| App-specific dynamic-noise handling | PRIOR/ADJACENT | Crawljax comparators, FragGen dynamism | Narrow distinction needed |
| Protected semantic anchor for a volatility rule | CANDIDATE | No direct counterpart found in reviewed set | Claim as scoped evidence mechanism |
| Run-frozen identity while collecting evidence | CANDIDATE | Feedback systems exist, but no direct same-run freeze lifecycle found | Strong candidate contribution |
| Candidate quarantine before trust | CANDIDATE | Learned classifiers generally output decisions directly | Strong candidate mechanism |
| Cross-session behavior-backed promotion | CANDIDATE | Functional equivalence is discussed broadly; direct promotion lifecycle not found | Strong but use narrow wording |
| Explicit abstraction provenance | CANDIDATE | No direct counterpart found | Supporting part of lifecycle |
| Offline revalidation of trusted abstraction | CANDIDATE | General model refinement exists; direct rule-level revalidation not found | Claim carefully |
| Freshness-aware trusted/challenged/revoked/cooldown/restored lifecycle | CANDIDATE | No direct counterpart found in reviewed web-GUI abstraction work | Strongest novelty candidate |
| Selective revalidation under fixed budget | CANDIDATE | Feedback-guided exploration exists, but rule-verification scheduling differs | Secondary candidate; heuristic not optimal |
| Immutable raw observations under alias projection | ADJACENT/CANDIDATE | Raw traces/models are common; reversible abstraction layer is narrower | Claim as architecture, not raw logging itself |
| Historical reprojection after rule revocation | CANDIDATE | No direct counterpart found in reviewed web-GUI abstraction work | Strong novelty candidate |
| Safe-only interaction policy | SUPPORTING | Safety constraints common in crawlers/agents | Artifact safety contribution |
| Same-origin enforcement | SUPPORTING | Standard crawler boundary | Correctness/safety requirement |
| Checkpoint/resume | SUPPORTING | Persistence/distributed crawling is established broadly | Robustness contribution, not main novelty |
| Freeze manifest + temporal replication discipline | SUPPORTING | Reproducible research practice | Artifact-quality contribution |

---

## Claims we should explicitly avoid

Do not write:

> StateScout is the first system to model dynamic web applications as state graphs.

Do not write:

> StateScout introduces semantic state abstraction for web testing.

Do not write:

> Existing approaches rely only on URL or raw DOM equality.

Do not write:

> StateScout is the first learned state abstraction.

Do not write:

> StateScout solves the web state-equivalence problem.

Do not write:

> Accessibility semantics are novel for browser agents/testing.

Do not write:

> StateScout's v4 outperforms the state of the art.

We have not run a fair head-to-head reproduction against Judge, FragGen, WebEmbed, or all baselines from the 2026 empirical study.

---

## Claims supported by the frozen artifact

### Claim A — URL-only identity is inadequate on the frozen controlled corpus

Supported:

```text
URL-only: 5/16
false merges: 10
false splits: 1
```

This is a corpus-specific empirical claim.

### Claim B — semantic control state materially contributes to identity

Supported by the Phase 18 ablation:

```text
v4: 14/16
v4 without controls: 9/16
```

Do not generalize this exact effect size beyond the frozen corpus.

### Claim C — syntax-only volatility normalization is unsafe

Supported by the measured v2/v3 counterexamples in which clock-like/ref-like values could be either noise or semantics depending on context.

### Claim D — scoped evidence can resolve the measured ambiguity

Supported by Phase 9 held-out result:

```text
v4 + trusted scoped profile: 6/6
FM=0
FS=0
```

This should be described as resolving the measured controlled contradiction, not as universal correctness.

### Claim E — stale abstraction can hide reachable state

Supported by Phase 13:

```text
stale profile coverage: 0.5
after revocation coverage: 1.0
```

This is a strong motivation for defeasible trust.

### Claim F — abstraction can be reversible over preserved history

Supported by Phase 16:

```text
raw: 6 observations / 7 transitions
trusted projection: 3 states
revoked projection: 6 states
restored projection: 3 states
raw digest unchanged
```

### Claim G — rule revalidation can be selectively scheduled

Supported by Phase 15's four-rule, budget-two benchmark.

Use "demonstrates a transparent bounded scheduler" rather than "optimal scheduling."

### Claim H — logical checkpoint resume preserves the controlled final graph

Supported by Phase 20 for both synthetic and Playwright controlled benchmarks.

This is a robustness claim, not the central state-abstraction novelty.

---

## Recommended central contribution statement

### Conservative version

> We present StateScout, an experimental web-UI exploration artifact that treats learned state abstraction as a defeasible cross-run hypothesis. Unlike a one-shot equivalence decision, each learned abstraction is scoped to a semantic anchor, promoted from quarantined evidence only between runs, revalidated over time, and capable of being challenged or revoked. StateScout also preserves immutable raw observations beneath the active equivalence projection, allowing later trust changes to reinterpret historical evidence without rewriting it.

### Slightly stronger version

> To our knowledge, the reviewed web-GUI state-abstraction literature does not provide an end-to-end rule lifecycle combining run-frozen evidence collection, behavior-backed cross-run promotion, freshness-aware challenge/revocation, bounded selective revalidation, and reversible reprojection over immutable historical observations. StateScout implements and evaluates that lifecycle.

Use the stronger version only with the qualifier **"to our knowledge, in the reviewed literature"**.

---

## Recommended title change

The original title:

> StateScout: Semantic State-Space Exploration for Modern Web Interfaces Under Bounded Safe Interaction

is accurate but too broad and overlaps heavily with established crawling/state-abstraction literature.

Recommended:

> **StateScout: Defeasible and Reversible Semantic State Abstraction for Web UI Exploration**

Alternative:

> **StateScout: Evidence-Backed Lifecycle Management for Semantic Web UI State Abstraction**

Alternative emphasizing the empirical thesis:

> **When State Equivalence Changes: Defeasible and Reversible Abstraction for Web UI Exploration**

The first option best balances system identity and research contribution.

---

## Recommended research-question revision

The frozen implementation does not directly complete the old proposal's locator-robustness RQ as a major comparative study.

The paper should use the Phase 21 RQs instead:

1. **RQ1 — Identity:** How do URL-only and progressively richer semantic identities trade false merges and false splits on controlled web UI states?
2. **RQ2 — Contextual abstraction:** Can repeated scoped evidence distinguish volatile presentation differences from meaningful state differences in the measured cases?
3. **RQ3 — Defeasibility:** Can trusted abstraction be challenged/revoked when behavior changes, and can historical distinctions be recovered without mutating raw evidence?
4. **RQ4 — Bounded maintenance:** Can multiple learned abstraction rules be prioritized for revalidation under a fixed budget?
5. **RQ5 — Operational robustness:** Can the exploration system enforce safe boundaries and resume interrupted exploration without changing the final controlled graph?

---

## Novelty confidence

### High confidence

- State graph itself is not novel.
- State abstraction itself is not novel.
- Learned/neural abstraction is not novel.
- Accessibility semantics are not novel.
- State-abstraction quality is a current, active research topic.

### Moderate confidence candidate novelty

- rule-level lifecycle of learned web state abstraction;
- run-frozen evidence with future-run promotion;
- explicit challenged/revoked/cooldown restoration lifecycle;
- reversible historical alias projection after trust change.

### Lower confidence / do not lead with

- selective revalidation scheduler;
- checkpointing;
- same-origin policy;
- semantic locator use.

These are useful supporting contributions but require broader specialized literature searches before any standalone novelty claim.
