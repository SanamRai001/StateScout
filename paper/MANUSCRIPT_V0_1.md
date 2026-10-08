# StateScout Manuscript v0.1

## Working title

**StateScout: Defeasible and Reversible Semantic State Abstraction for Web UI Exploration**

## Abstract — draft

Modern web applications can expose many interaction states at the same URL, while dynamic content, timestamps, generated identifiers, and repeated data can make equivalent states appear different. Automated web explorers therefore depend on a state abstraction that avoids both false splits, which waste exploration effort, and false merges, which can hide reachable behavior. Prior work has proposed DOM similarity, configurable comparators, page fragmentation, neural embeddings, and learned classifiers for web-state abstraction. This paper investigates a complementary question: **how should an abstraction decision be governed after it is learned?**

We present StateScout, an experimental Playwright-based web UI explorer that treats learned state abstraction as a defeasible cross-run hypothesis rather than a permanent classifier output. StateScout represents browser state using user-facing semantic features and records candidate volatility without changing the identity function of the run that observed it. Candidates are promoted only between runs after repeated scoped observations and stable safe-probe behavior. Trusted rules carry provenance and freshness, can become challenged or revoked when later behavior diverges, can be selectively scheduled for revalidation under a bounded budget, and operate over an immutable archive of raw observations so later trust changes can reproject historical equivalence without deleting evidence.

Across controlled benchmarks, URL-only identity classified 5/16 state pairs correctly, while the frozen semantic baseline classified 14/16; removing semantic controls reduced performance to 9/16. Earlier syntax-oriented normalization produced measured false merges when time- or reference-like values were semantically meaningful, while scoped learned volatility resolved the corresponding held-out benchmark at 6/6. In a drift benchmark, stale abstraction reduced reachable-state coverage to 0.5, whereas revocation restored full coverage. Reversible reprojection expanded the same immutable six-observation archive from three trusted projected states to six states after revocation and back to three after trust restoration. A five-target public-site study produced three evaluable targets and no run-level StateScout errors, while a later replication demonstrated temporal variability in graph stability. Finally, logical checkpoints resumed both a 256-state synthetic exploration and a depth-32 Playwright exploration to the same final controlled graphs as uninterrupted runs.

The results do not establish a universally optimal state classifier. Instead, they provide evidence that web-state abstraction benefits from explicit lifecycle management: evidence should be scoped, promotion should be delayed, trust should be defeasible, and raw observations should survive abstraction.

## 1. Introduction — draft

Modern web applications are not collections of static pages. A single route can expose dialogs, menus, tabs, expanded panels, asynchronous results, client-side forms, and other interaction states without changing the URL. Automated testing and crawling systems therefore need a model of *application state* that is richer than navigation history alone.

This problem has been recognized for years. GUI ripping and event-flow models established automatic reverse engineering of interactive interfaces. AJAX crawlers such as Crawljax showed that dynamic web applications can be explored by incrementally reconstructing a state-flow graph. Later systems addressed the central state-abstraction problem using DOM comparison, configurable noise comparators, hashing, page fragmentation, learned embeddings, and classifiers. Recent work such as FragGen, WebEmbed, and Judge demonstrates that accurately grouping functionally equivalent pages while separating behaviorally distinct pages remains an active and consequential research problem.

The difficulty is asymmetric. If an abstraction is too strict, equivalent observations become multiple states. These **false splits** increase graph size and waste exploration effort. If an abstraction is too permissive, distinct observations collapse into one state. These **false merges** are more dangerous for exploration because the crawler can incorrectly mark an area as already explored and fail to visit behavior reachable only from the merged-away distinction.

Most state-abstraction techniques focus on the current classification decision: given two page observations, should they be considered the same state? StateScout investigates a different question. Web applications evolve, dynamic fields may change meaning over time, and evidence available in one run may be insufficient to justify permanent abstraction. We therefore ask: **what lifecycle should govern an abstraction assumption after evidence suggests that two observations are equivalent?**

StateScout treats learned abstraction as a defeasible hypothesis. A field that varies is not immediately ignored. Variation first becomes a quarantined candidate scoped to a protected semantic anchor. Candidate evidence is accumulated across sessions, and promotion occurs only between runs after sufficient repeated observations and stable behavior under safe probes. Once trusted, a rule is not permanent: later evidence can challenge it, persistent conflict can revoke it, stable evidence can restore it, and freshness determines whether it remains active. When multiple rules need verification, a transparent scheduler can prioritize a bounded subset. Crucially, StateScout does not discard the raw observations hidden by a trusted abstraction. It preserves an immutable observation/transition archive and derives the current equivalence projection from that history, allowing revocation to reveal historical distinctions without rewriting the original evidence.

This design also imposes a reproducibility constraint: evidence collected during a run cannot mutate that run's identity function. The active fingerprinter is frozen at run start. Learned evidence changes only future runs. This prevents the meaning of a graph node from changing halfway through the exploration that created it.

We evaluate the design through a sequence of frozen controlled benchmarks, negative counterexamples, broader state-pair comparisons, ablations, lifecycle/drift experiments, repeated public-site runs, and checkpoint/recovery stress tests. The experiments are intentionally evolutionary: earlier fingerprint strategies are preserved after they fail so later results can be interpreted against the exact counterexamples that motivated the next design.

The paper makes the following contributions:

1. **A defeasible abstraction lifecycle.** StateScout represents learned state-abstraction rules as explicit cross-run objects with scoped evidence, provenance, delayed promotion, freshness, challenge, revocation, cooldown, and restoration.
2. **Run-frozen evidence collection.** StateScout separates observation from trust updates so evidence collected in one run cannot change that run's state identity.
3. **Reversible historical equivalence.** Raw semantic observations and transitions remain immutable beneath the active alias projection, allowing later trust changes to split or recombine historical observations without deleting evidence.
4. **Bounded rule maintenance.** StateScout includes a transparent selective-revalidation mechanism for prioritizing multiple learned rules under a fixed verification budget.
5. **A reproducible experimental artifact.** The frozen artifact includes controlled false-merge/false-split benchmarks, ablations, negative results, a real-world repeated-run study, a temporal replication log, same-origin safety enforcement, and digest-verified checkpoint/resume.

These contributions are deliberately narrower than claiming a new general-purpose state classifier. StateScout does not outperform every modern abstraction method, and we do not present a head-to-head evaluation against Judge, FragGen, or WebEmbed. Instead, the paper studies the governance and reversibility of abstraction decisions once they are represented as learned assumptions in a stateful explorer.

## 2. Background and problem formulation — draft skeleton

### 2.1 Web UI exploration as a directed state graph

Define:

- semantic observation;
- interaction;
- transition;
- state identity function;
- directed graph;
- replay path.

Emphasize graph-not-tree because multiple paths may converge and cycles are normal.

### 2.2 False splits and false merges

Define pairwise error types.

Explain exploration consequence:

- false split -> redundant exploration;
- false merge -> potentially hidden reachable subtree.

### 2.3 Why volatility is contextual

Use the measured contradiction:

- Dashboard second-resolution clock as noise;
- Auction second-resolution clock as semantic.

Therefore no syntax-only rule such as "timestamps are volatile" is universally safe.

### 2.4 State abstraction as a defeasible hypothesis

Introduce the conceptual move:

```text
classifier output
    vs
evidence-backed rule with lifecycle
```

A learned abstraction is not truth; it is a scoped hypothesis that remains valid only while evidence supports it.

## 3. Related work — draft

### 3.1 GUI ripping and event-flow modeling

Memon's GUI-ripping and event-flow work established dynamic extraction of GUI models for automated testing. StateScout inherits the idea that interaction structure can be reverse-engineered from an executable interface; it does not claim graph extraction as novel.

### 3.2 AJAX/web state-flow crawling

Crawljax established dynamic state-flow graph construction for AJAX applications and demonstrated why URL identity is inadequate for client-side web state. Subsequent Crawljax work introduced configurable comparator pipelines to remove known dynamic differences before state comparison. StateScout differs in when and how such differences become trusted: its volatility rules are learned from scoped cross-run evidence, do not mutate the run that collected them, and can later be revoked.

### 3.3 Feedback-directed and scriptless exploration

ARTEMIS, WebMate, FEEDEx, AutoBlackTest, and TESTAR-related work show a broad design space for automated GUI/web exploration, feedback-guided action selection, replay, and inferred state models. StateScout's BFS exploration and action scheduling are therefore supporting architecture rather than the primary novelty.

### 3.4 Near-duplicate and learned state abstraction

MinHash-based scanning, FragGen, WebEmbed, and Judge directly address state equivalence for dynamic web pages. FragGen uses structural/visual fragments to avoid threshold-based whole-page comparison. WebEmbed uses neural embeddings and classifiers. Judge combines DOM structure merging with contrastive learning and classification and reports strong state-pair and exploration results. These systems are stronger baselines for state classification than URL or raw equality.

StateScout does not claim a superior universal classifier. Its contribution is orthogonal: it gives learned abstraction assumptions an explicit lifecycle and preserves the raw evidence needed to revise those assumptions later.

### 3.5 Modern web-agent observation spaces

WebArena, WorkArena, and BrowserGym support DOM, screenshot, and accessibility-tree observations. Their use of accessibility semantics confirms that role/name-oriented browser observations are established modern practice. StateScout uses similar user-facing semantics for deterministic state exploration rather than LLM task completion.

### 3.6 Gap addressed by StateScout

Across the reviewed literature, state abstraction is typically represented as a comparator, similarity function, clustering method, embedding/classifier, or structural normalization. We did not find a directly comparable web-GUI abstraction architecture that combines:

- run-frozen identity;
- quarantined evidence;
- behavior-backed promotion between runs;
- explicit trust provenance/freshness;
- challenge/revocation/restoration;
- bounded selective revalidation;
- immutable raw history;
- reversible historical reprojection.

Accordingly, StateScout is positioned as a **lifecycle architecture for learned state abstraction**, not as the invention of state abstraction itself.


## 4. StateScout design — draft

### 4.1 Semantic observation and state identity

StateScout represents a browser observation as a deliberately compact semantic snapshot rather than a serialized DOM. The frozen representation contains:

- origin and path;
- normalized query parameters;
- document title;
- visible headings;
- landmarks;
- accessible dialog identities;
- interactive controls and selected control state, including properties such as selected, expanded, checked, disabled, and visible form value where observed.

Let an observation be (o), and let a state-identity function (f) map (o) to a canonical representation and cryptographic hash. Two observations are treated as the same explored state when the active run fingerprinter produces the same state hash.

StateScout deliberately distinguishes the **observer** from the **fingerprinter**. The observer decides which browser semantics become available to state identity. The fingerprinter decides which observed differences remain semantic after normalization or trusted abstraction. Phase 17 demonstrates why this distinction matters: two meaningful content changes were false-merged because ordinary paragraph/list content was not represented by the production observer at all.

### 4.2 Directed graph exploration

Exploration produces a directed graph (G=(V,E)), where each state node (v in V) stores its semantic snapshot and fingerprint and each transition records:

- source state;
- interaction identity;
- optional destination state;
- outcome status;
- optional execution error.

The graph is not a tree. Several action paths may converge on one state, and cycles are expected.

The BFS frontier stores work items of the form:

[
(	ext{source state}, 	ext{interaction}, 	ext{replay path})
]

and maintains a separate seen set over ((	ext{source state}, 	ext{interaction})). This prevents one interaction from being repeatedly scheduled merely because the same semantic state is reached through multiple paths.

### 4.3 Replay restoration

Browser execution is sequential, but BFS may later expand a state that is no longer active in the browser. Each frontier item therefore carries a replay path from the exploration root.

Before executing a pending interaction, StateScout:

1. navigates back to the configured start state;
2. replays the stored interactions;
3. observes each intermediate state;
4. verifies the expected semantic fingerprint;
5. restores the intended source state;
6. executes the pending interaction.

A same-document/hash reset defect discovered during Phase 13 was fixed by explicitly reloading same-document start URLs before replay. Phase 20 later makes replay cost observable through a depth-32 benchmark.

### 4.4 Interaction discovery and safety boundary

StateScout discovers user-facing interactions from semantic browser controls. Locator candidates prefer user-facing contracts such as role/name and may also include test IDs, links, and text where appropriate.

Every interaction receives a deterministic risk classification. The default policy executes only interactions classified as safe. Mutating and destructive actions remain blocked.

The browser explorer also freezes a same-origin crawl boundary from the run's start URL. External-origin navigation is recorded as blocked-by-policy rather than executed. This browser-level enforcement was added after Phase 19 exposed that the core boundary helper existed but had not been consulted before discovered links were enqueued.

The safety policy intentionally trades exploration coverage for conservative execution.

### 4.5 Fingerprint evolution

The project preserves four fingerprint generations because later designs were driven by measured failures rather than replacing the historical evidence.

**v1** is the frozen semantic baseline.

**v2** removes measured tracking-query noise and normalizes title time tokens. It fixes early false splits but later produces false merges on semantic `ref` values and meaningful time values.

**v3** restores `ref` semantics and narrows title-time normalization to second-resolution clocks. A broader benchmark then shows that even a second-resolution time can be meaningful.

**v4** removes global clock normalization. Dynamic title/query values are abstracted only when an explicit trusted volatility profile contains a rule for the exact field and protected semantic anchor.

The production/frozen paper baseline uses v4 with either an empty profile or an explicitly materialized trusted profile, depending on the experiment.

### 4.6 Protected anchors and volatility candidates

A volatility field is either the title or a named query field. A protected semantic anchor is derived from the remainder of the snapshot after excluding the candidate field and known tracking noise.

A candidate volatility rule is considered only when repeated observations share the same protected anchor while the candidate field varies.

Phase 10 freezes the default candidate-promotion thresholds:

- at least 4 observations;
- at least 2 sessions;
- at least 3 distinct field values;
- at least 4 behavior-evidence records.

Variation alone does not make a rule trusted. Candidates remain quarantined until they meet both observation and behavior requirements.

### 4.7 Behavior-backed offline promotion

Behavior evidence associates the candidate field/anchor with a downstream behavior signature obtained from bounded safe probes.

A candidate whose varying values lead to one stable observed behavior signature can become eligible for promotion. A candidate with divergent behavior remains quarantined.

Promotion is performed offline between runs. The active fingerprinter is frozen at run start, so evidence collected during run (r) cannot change state identity inside run (r). The resulting trusted profile may affect only a later run.

This run-frozen boundary is a core reproducibility property: the equivalence relation used to construct one graph cannot change halfway through constructing that graph.

### 4.8 Revalidation and trust lifecycle

A trusted rule is not permanent.

Later rule-scoped behavior evidence can retain or revoke the rule. Phase 13 requires sufficient evidence before revocation; unrelated anchor/field evidence cannot challenge the rule.

Phase 14 adds a trust lifecycle with states:

[
	ext{trusted} ightarrow 	ext{challenged} ightarrow 	ext{revoked} ightarrow 	ext{cooldown} ightarrow 	ext{trusted}
]

with a stable evidence path that can clear a challenge before revocation.

The frozen policy uses:

- maximum trust age: 30 days;
- maximum evidence age: 7 days;
- 2 conflicting evidence windows to revoke;
- 2 stable windows to restore;
- the Phase 13 revalidation evidence threshold.

Only fresh, exact-scope, trusted rules are materialized into the active future-run volatility profile.

### 4.9 Selective revalidation

When multiple rules require maintenance, Phase 15 uses an explicit deterministic priority score:

[
P = U + F + C + I
]

where:

- (U) is trust-state urgency;
- (F) is freshness risk;
- (C) is conflict history;
- (I) is estimated coverage impact.

The scoring weights are transparent experimental choices, not claimed optimal. The scheduler ranks all eligible rules deterministically and selects the highest-priority subset under a fixed budget.

### 4.10 Immutable raw archive and reversible projection

StateScout separates raw observation history from the current abstraction.

The raw archive stores semantic observations and transitions with stable raw identities. A projection maps those raw observations into the state identities produced by a selected fingerprinter/profile.

When a trusted rule aliases several raw observations, the projection can merge those observations and transitions. If the rule is later revoked, the same raw archive can be reprojected conservatively and the previously hidden distinctions become visible again.

Reprojection does not claim to recover interactions that were never explored because an earlier false merge prevented their execution. It recovers only distinctions present in already-recorded evidence; future exploration is still required to discover previously missed descendants.

### 4.11 Logical checkpoint and resume

Phase 20 adds a logical exploration checkpoint containing:

- start URL;
- attempted-transition count;
- root replay path;
- state-graph snapshot;
- BFS frontier snapshot;
- complete seen-work set;
- accumulated evidence errors.

The checkpoint payload is SHA-256 hashed. Parsing rejects a modified payload.

State-graph restoration recomputes every stored fingerprint with the current run fingerprinter and rejects a mismatch. StateScout does not serialize a Chromium process or JavaScript heap. After resume, the restored frontier uses the same replay mechanism to reconstruct each pending source state.

---

## 5. Experimental methodology — draft

### 5.1 Study design

The evaluation follows a failure-driven sequence rather than a one-shot benchmark.

For each major identity change, the project attempted to freeze the relevant ground truth before implementing the change. Earlier algorithms remain available so later benchmarks can reproduce their failures. When a benchmark falsified a hypothesis, the negative result was retained.

The experiments fall into four categories:

1. **controlled pairwise state-identity experiments**, with manually frozen same/different labels;
2. **controlled lifecycle and exploration experiments**, with known state/transition ground truth;
3. **real-world observational experiments**, where no complete state oracle is claimed;
4. **scalability/recovery experiments**, where correctness is separated from machine-dependent timing.

After Phase 20, the implementation, benchmark, and test trees were frozen before paper writing.

### 5.2 Pairwise state-equivalence protocol

For a labeled pair ((o_a,o_b)), a strategy predicts **same** when its state hashes are equal and **different** otherwise.

Each pair has one frozen expected relation.

We report:

- **correct pairs**;
- **accuracy** (= 	ext{correct}/N);
- **false merges (FM)**: expected different, predicted same;
- **false splits (FS)**: expected same, predicted different.

False merges and false splits are always reported separately because they have different exploration consequences.

The Phase 17 corpus contains 16 labeled pairs across seven families:

- structural noise;
- control state;
- form state;
- navigation;
- overlay/dialog state;
- temporal state;
- content coverage.

The frozen label distribution is:

- 4 expected-same pairs;
- 12 expected-different pairs.

### 5.3 Phase 18 baselines and ablations

All Phase 18 strategies are evaluated on the exact same browser-observed Phase 17 pairs.

The nine compared strategies are:

1. URL-only;
2. fingerprint v1;
3. fingerprint v2;
4. fingerprint v3;
5. fingerprint v4 with an empty volatility profile;
6. v4 without controls;
7. v4 without title;
8. v4 without query;
9. v4 plus an evaluation-only targeted visible-content observation.

The targeted-content variant captures visible text from `p`, `li`, `[role=status]`, and `[role=alert]`. It is an ablation/diagnostic condition only; it is not the frozen production observer and is not named v5.

The evaluator freezes both aggregate metrics and the exact failed case IDs, preventing one error type from being silently traded for another while keeping the same aggregate score.

### 5.4 Contextual-volatility experiment

Phase 9 tests whether a scoped trusted profile can resolve a contradiction that global syntax normalization cannot.

Training observations contain Dashboard title/query fields that vary while a protected semantic anchor remains stable. Held-out pairs include:

- new Dashboard volatile values expected equivalent;
- an Auction second-resolution title expected different;
- an Invoice query value expected different;
- semantic `ref` query values expected different;
- known tracking noise expected equivalent.

v1-v4 are evaluated on the same held-out labels. v4 is supplied only the trusted anchor-scoped profile learned from the training observations.

### 5.5 Candidate promotion and behavior evidence

Phase 10 constructs two controlled candidates.

The Dashboard candidate satisfies the frozen observation thresholds and produces one stable downstream behavior signature.

The Auction candidate varies similarly but produces divergent downstream behavior signatures.

The experiment evaluates candidate eligibility and compares v4 with an empty profile against v4 after offline promotion.

### 5.6 Evidence persistence and offline-learning protocol

Phase 11 integrates evidence collection into Playwright exploration while freezing identity at run start. Evidence-sink faults are deliberately injected to ensure evidence-sidecar failure does not corrupt the exploration graph.

Phase 12 writes observation evidence, behavior evidence, and a frozen promoted-profile artifact. A future crawl loads the persisted profile. The experiment therefore distinguishes:

- the run that collects evidence;
- the offline promotion step;
- the later run whose identity may change.

### 5.7 Revalidation and lifecycle-drift protocol

Phase 13 starts from a trusted volatility rule and presents two later evidence regimes:

- stable behavior;
- evolved divergent behavior.

The evolved scenario compares a future crawl using the stale trusted profile with a future crawl after revocation.

The controlled coverage metric is `meaningfulDetailsCoverage`, defined by the benchmark's known meaningful detail states.

Phase 14 extends the same rule through explicit evidence windows to test:

- retain;
- challenge;
- duplicate-window idempotence;
- challenge clearing;
- persistent conflict/revocation;
- cooldown/restoration;
- stale evidence rejection;
- scope mismatch;
- trust expiration.

A challenged rule is excluded from the next active profile even before final revocation.

### 5.8 Selective-revalidation protocol

Phase 15 freezes four rules with different lifecycle states, trust ages, conflict histories, and externally supplied estimated coverage impacts.

The fixed verification budget is two rules.

The experiment records:

- full deterministic ranking;
- selected rules;
- selected fraction;
- preserved state of unselected lifecycle entries.

The study evaluates scheduler behavior, not optimality of the scoring weights.

### 5.9 Reversible-history protocol

Phase 16 begins with an immutable raw archive containing six observations and seven transitions.

The same archive is projected using:

1. a trusted profile;
2. a revoked/conservative profile;
3. a restored trusted profile.

The experiment records projected state/transition counts and verifies that the raw archive digest remains unchanged.

This isolates reversibility of interpretation from mutation of historical evidence.

### 5.10 Real-world repeated-run protocol

Phase 19 is observational because public applications do not provide a complete semantic-state oracle.

The primary cohort contains:

- TodoMVC React;
- The Internet Dynamic Controls;
- UI Testing Playground Visibility.

After the first cohort produced insufficient reachable targets, a recovery cohort was preregistered before observing fallback outcomes:

- W3C ARIA APG Automatic Tabs;
- Selenium Web Form.

Each target receives:

- 3 runs;
- a fresh Chromium browser context per run;
- v4 with an empty volatility profile;
- default same-origin safe-only policy;
- maximum 6 attempted transitions;
- 15-second navigation timeout;
- 10-second action timeout.

Run outcomes are separated into:

- **success**;
- **unavailable**, when preflight navigation fails;
- **run-error**, when the target is reachable but StateScout itself fails.

Interaction-level failures remain transition outcomes rather than run-level errors.

A target is evaluable for stability only if at least 2 of its 3 runs succeed. The combined study is accepted only when at least 2 distinct targets are evaluable.

For successful runs we record:

- initial fingerprint;
- graph signature;
- states;
- transitions;
- attempted transitions;
- evidence errors;
- observed, blocked, failed, and no-state-change transition counts.

The original accepted Phase 19 result is frozen. A later rerun is reported separately as a temporal replication and does not replace the original observation.

### 5.11 Scalability and recovery protocol

Phase 20 uses two controlled layers.

#### Synthetic scale

A deterministic state machine is explored at:

- 64 states;
- 128 states;
- 256 states.

The main safe interaction advances to the next state. Every 16th state also exposes a deterministic probe recorded as a failed transition.

Frozen final counts are evaluated for complete coverage and injected-failure preservation.

The 256-state run is also interrupted after 100 attempted transitions, serialized, parsed, and resumed. The final resumed graph signature must equal the uninterrupted graph signature.

#### Browser deep replay

A Playwright fixture contains a linear depth-32 workflow, producing 33 semantic states and 32 transitions.

The experiment records observation-phase counts. For an uninterrupted linear workflow, restoring source states produces 496 replay-step observations:

[
sum_{i=0}^{31} i = 496.
]

The browser run is also interrupted after 10 attempts and resumed from a logical checkpoint. Resumed and uninterrupted final graph signatures must match.

Duration, heap delta, and checkpoint byte size are recorded but are not machine-independent pass/fail thresholds.

### 5.12 Environment

The final frozen correctness gate was verified with:

- Node.js v24.19.0;
- Windows x64;
- Chromium installed through Playwright;
- strict TypeScript typecheck;
- 75/75 tests passing.

The implementation is TypeScript/Node and is not intentionally Windows-specific. The environment is disclosed as the reference reproduction configuration.

### 5.13 Freeze and reproducibility protocol

The paper artifact freezes the Phase 20 research baseline at commit:

`d4aa27d4e2516555a30741f9829785b0db12316e`.

A machine-readable manifest protects the Git tree identities of:

- `src/`;
- `benchmarks/`;
- `tests/`.

The Phase 21 verifier requires all three trees to match the frozen identities.

Controlled reproduction and public-site replication are intentionally separate:

- `npm run research:reproduce-controlled` reruns the deterministic/local research suite;
- `npm run research:rerun-real-world` repeats the external observational study without replacing the frozen Phase 19 result.


## Remaining manuscript sections

6. Results  
7. Discussion  
8. Threats to validity  
9. Artifact and reproducibility  
10. Conclusion

Sections 4 and 5 are now drafted from the frozen Phase 21 artifact. The remaining sections should be completed without algorithm changes.
