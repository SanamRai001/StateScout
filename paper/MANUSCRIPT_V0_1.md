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

Figure 1 summarizes the lifecycle. StateScout treats learned abstraction as a defeasible hypothesis. A field that varies is not immediately ignored. Variation first becomes a quarantined candidate scoped to a protected semantic anchor. Candidate evidence is accumulated across sessions, and promotion occurs only between runs after sufficient repeated observations and stable behavior under safe probes. Once trusted, a rule is not permanent: later evidence can challenge it, persistent conflict can revoke it, stable evidence can restore it, and freshness determines whether it remains active. When multiple rules need verification, a transparent scheduler can prioritize a bounded subset. Crucially, StateScout does not discard the raw observations hidden by a trusted abstraction. It preserves an immutable observation/transition archive and derives the current equivalence projection from that history, allowing revocation to reveal historical distinctions without rewriting the original evidence.

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

Phase 10 freezes the default candidate-promotion thresholds (the promotion/lifecycle sequence is summarized in Figure 1):

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

For a labeled pair (o_a, o_b), a strategy predicts **same** when its state hashes are equal and **different** otherwise.

Each pair has one frozen expected relation.

We report:

- **correct pairs**;
- **accuracy** = correct / N;
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

Table 1 and Figure 2 report the resulting comparison. The nine compared strategies are:

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

Figure 3 visualizes the controlled coverage consequence of stale versus revoked trust. Phase 13 starts from a trusted volatility rule and presents two later evidence regimes:

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

Figure 4 and Table 3 summarize the reversible-history/lifecycle evidence. Phase 16 begins with an immutable raw archive containing six observations and seven transitions.

The same archive is projected using:

1. a trusted profile;
2. a revoked/conservative profile;
3. a restored trusted profile.

The experiment records projected state/transition counts and verifies that the raw archive digest remains unchanged.

This isolates reversibility of interpretation from mutation of historical evidence.

### 5.10 Real-world repeated-run protocol

Table 4 keeps the original accepted Phase 19 observation separate from the later temporal replication. Phase 19 is observational because public applications do not provide a complete semantic-state oracle.

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

Table 2 reports the Phase 20 scale and recovery measurements. Phase 20 uses two controlled layers.

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

The experiment records observation-phase counts. For an uninterrupted linear workflow, restoring source states produces 496 replay-step observations because the replay depths sum to:

~~~text
0 + 1 + 2 + ... + 31 = 496
~~~

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


## 6. Results — draft

This section answers the five research questions using only the frozen Phase 0-20 evidence. Controlled correctness results and real-world observational results are kept separate.

### 6.1 RQ1 — How do URL-only and progressively richer semantic identities trade false merges and false splits?

Table 1 and Figure 2 summarize the main controlled comparison on the 16-pair Phase 17 corpus.

| Strategy | Correct | Accuracy | FM | FS |
| --- | ---: | ---: | ---: | ---: |
| URL-only | 5/16 | 0.3125 | 10 | 1 |
| v1 | 13/16 | 0.8125 | 2 | 1 |
| v2 | 13/16 | 0.8125 | 3 | 0 |
| v3 | 13/16 | 0.8125 | 3 | 0 |
| v4 | 14/16 | 0.8750 | 2 | 0 |
| v4 without controls | 9/16 | 0.5625 | 7 | 0 |
| v4 without title | 13/16 | 0.8125 | 3 | 0 |
| v4 without query | 13/16 | 0.8125 | 3 | 0 |
| v4 + targeted content | 16/16 | 1.0000 | 0 | 0 |

URL-only identity performed poorly because many meaningful state differences occurred without a URL change. It correctly classified only 5/16 pairs and produced 10 false merges.

The frozen v4 semantic baseline classified 14/16 pairs correctly with two false merges and no false splits. Both remaining errors came from meaningful visible content that the production observer did not represent: plain status text and list content.

The ablations clarify which observed features contributed to the v4 result. Removing controls caused the largest degradation, from 14/16 to 9/16, and increased false merges from 2 to 7. Removing title or query each reduced correctness to 13/16 and introduced one additional false merge.

The evaluation-only targeted-content condition captured visible paragraph, list-item, status-role, and alert-role text and reached 16/16 on this corpus. Importantly, it changed predictions for exactly the two known content-coverage failures and no other frozen pair.

Earlier experiments explain why the final semantic design is not simply "normalize more." v2 removed measured noise but later produced two false merges on semantic ref and meaningful time values. v3 repaired those cases but Phase 8 exposed a meaningful second-resolution title time that v3 still normalized. These counterexamples show that a syntactic category such as "clock-like text" is not sufficient evidence of volatility.

**Answer to RQ1.** On the frozen controlled corpus, semantic state identity substantially reduced false merges relative to URL-only identity, and semantic control state was the strongest measured feature group in the v4 ablation. However, the remaining v4 errors also show that correctness is bounded by observer coverage; the experiment does not establish that the current observer captures every semantically meaningful visible change.

### 6.2 RQ2 — Can repeated scoped evidence distinguish volatile presentation differences from meaningful state differences in the measured cases?

Phase 9 evaluates a case where the same syntactic form can be either noise or semantics.

The held-out benchmark contains six pairs that mix Dashboard title/query values that vary but should be equivalent with Auction, Invoice, ref, and tracking cases that should retain their semantic distinction.

The comparison was:

| Strategy | Correct | FM | FS |
| --- | ---: | ---: | ---: |
| v1 | 3/6 | 0 | 3 |
| v2 | 2/6 | 2 | 2 |
| v3 | 3/6 | 1 | 2 |
| v4 + trusted scoped profile | 6/6 | 0 | 0 |

The result is important because v4 does not introduce another global regex for the same values. It removes global title-clock normalization and applies dynamic-field abstraction only when an explicit trusted rule matches both the field and the protected semantic anchor.

Phase 10 then tests whether variation alone is sufficient for trust. The Dashboard candidate met the repeated-observation thresholds and produced one stable downstream behavior signature, so it became eligible for promotion. The Auction candidate had superficially similar value variation but produced divergent downstream behavior and remained ineligible.

Phases 11 and 12 separate evidence collection from identity mutation. Evidence is collected while the run's fingerprinter remains frozen, and promotion occurs offline for a later run.

**Answer to RQ2.** In the controlled ambiguity cases, scoped repeated evidence plus stable safe-probe behavior distinguished the measured volatile Dashboard fields from meaningful Auction, Invoice, and ref differences and eliminated both false merges and false splits in the six-pair held-out benchmark. The result supports contextual evidence over syntax-only normalization, but it does not prove that the current evidence thresholds or safe probes generalize to every application.

### 6.3 RQ3 — Can trusted abstraction be challenged or revoked after behavior changes, and can historical distinctions be recovered without rewriting raw evidence?

Phase 13 introduces behavior drift after a rule has already become trusted.

Using the stale trusted profile on the evolved fixture produced:

~~~text
controlled meaningful-details coverage: 0.5
states: 2
transitions: 3
attempts: 3
~~~

After offline revalidation detected divergent behavior and revoked the rule:

~~~text
controlled meaningful-details coverage: 1.0
states: 6
transitions: 6
attempts: 6
failed transitions: 0
~~~

Figure 3 visualizes this result. It demonstrates the exploration consequence of a false merge: stale trust can suppress a meaningful distinction and therefore hide reachable state.

Phase 14 extends revocation into a longer lifecycle. The same frozen experiment reproduces retained trust, challenge, duplicate-window idempotence, challenge clearing, persistent-conflict revocation, cooldown, restoration, stale-evidence rejection, scope mismatch, and trust expiration. A challenged rule is already excluded from the next active profile, making the next run conservative before permanent revocation.

Phase 16 tests whether historical evidence survives these trust changes. The immutable archive contains six raw observations and seven raw transitions. The same archive projects to:

~~~text
trusted profile:  3 states / 6 transitions
revoked profile:  6 states / 7 transitions
restored profile: 3 states / 6 transitions
~~~

The raw archive digest remains unchanged. Figure 4 shows the 3 -> 6 -> 3 projection while the six raw observations remain fixed.

This does not mean revocation can retroactively discover interactions that were never executed. Reprojection can recover distinctions already present in the archive; a later conservative crawl is still needed to explore descendants that an earlier false merge prevented from being visited.

**Answer to RQ3.** Yes, in the controlled drift experiment, later behavior evidence revoked stale trust and restored full known coverage. The same frozen raw history could also be reprojected from merged to split and back again without modifying the archive. The result supports defeasible and reversible interpretation, not retroactive recovery of unobserved behavior.

### 6.4 RQ4 — Can multiple learned abstraction rules be prioritized for revalidation under a fixed verification budget?

Phase 15 freezes four rules with different lifecycle states, ages, conflict histories, and estimated coverage impacts.

The deterministic priority scores were:

~~~text
challenged-critical: 150
trusted-aging:        84
cooldown-medium:      80
trusted-fresh-low:    11
~~~

With a budget of two rules, StateScout selected the challenged high-impact rule and the aging trusted rule.

The selected fraction was 0.5, corresponding to two of four rule-level verification units. Evidence applied to the selected challenged rule cleared its challenge, while unrelated lifecycle entries preserved their previous states.

The scheduler therefore demonstrates that lifecycle maintenance can be explicitly bounded rather than revalidating every learned rule on every cycle.

**Answer to RQ4.** The controlled four-rule benchmark shows that StateScout can deterministically rank and select a bounded subset while preserving unselected rule state. The experiment validates scheduler behavior, not the optimality of the priority formula or its manually chosen weights, and the estimated coverage-impact input is currently external metadata.

### 6.5 RQ5 — Can exploration remain safe and recoverable under public-site variability, deep replay, failed interactions, and interruption?

The accepted Phase 19 study requested 15 runs across five public targets. The combined result was:

~~~text
successful runs: 9
unavailable runs: 6
StateScout run-level errors: 0
evaluable targets: 3/5
study evaluable: true
~~~

The original per-target stability result was:

| Target | Initial stable | Graph stable |
| --- | --- | --- |
| TodoMVC React | no | no |
| W3C APG Automatic Tabs | yes | no |
| Selenium Web Form | yes | yes |

The Internet Dynamic Controls and UI Testing Playground Visibility were externally unavailable and therefore not used for stability claims.

The study also exposed a safety defect before the final recovery run: the core same-origin helper existed, but the browser explorer was not consulting it before enqueueing discovered links. The correction added browser-level same-origin enforcement and a regression proving that an external link is recorded as blocked-by-policy and never becomes a discovered state.

A later temporal replication remained evaluable with the same 9 successful and 6 unavailable runs, but TodoMVC changed to stable initial identity and a stable graph. W3C remained graph-unstable and Selenium remained stable. This confirms why the public study is observational and timestamped rather than treated as immutable ground truth.

Phase 20's synthetic workload produced the frozen correctness counts:

| States | Transitions | Attempts | Injected failures |
| ---: | ---: | ---: | ---: |
| 64 | 67 | 67 | 4 |
| 128 | 135 | 135 | 8 |
| 256 | 271 | 271 | 16 |

The 256-state run was interrupted after 100 attempts and resumed from a serialized checkpoint. The resumed run finished with 256 states, 271 transitions, 16 failed probe transitions, and 271 total attempts, and its final canonical graph signature matched the uninterrupted run. A deliberately modified checkpoint failed digest verification.

The depth-32 Playwright benchmark produced 33 states, 32 transitions, 32 attempts, 496 replay-step observations, 32 restored-source observations, and 32 after-interaction observations.

A second browser run was interrupted after 10 attempts, checkpointed, resumed in a fresh page, and completed at 32 attempts with the same final canonical graph signature as the uninterrupted run.

The 496 replay-step count also exposes a scalability limitation. In this linear fixture, replay depth grows with source-state depth, yielding 0 + 1 + ... + 31 = 496 replay-step observations. Checkpointing avoids restarting completed logical work, but it does not eliminate replay cost for the pending source state.

**Answer to RQ5.** The frozen experiments show that StateScout can enforce a conservative same-origin safe-only boundary and can resume controlled interrupted explorations to the same final graph while preserving injected failed transitions. Public-site graph stability is not guaranteed, and deep replay remains a measurable cost.

### 6.6 Summary of RQ answers

The experiments support a narrower conclusion than "StateScout solves state equivalence."

- **RQ1:** semantic state features substantially outperform URL-only identity on the frozen corpus, with controls contributing strongly; observer coverage remains a limitation.
- **RQ2:** scoped cross-run evidence and behavior checks resolve the measured dynamic-versus-semantic ambiguity more safely than global syntax normalization.
- **RQ3:** learned abstraction can become stale; explicit revocation restores controlled coverage, and historical raw observations support reversible reprojection.
- **RQ4:** maintenance of multiple rules can be explicitly budgeted, although the current ranking heuristic is not claimed optimal.
- **RQ5:** the explorer can enforce safe boundaries and recover logical progress after interruption, but public-site stability and replay cost remain open operational concerns.

---

## 7. Discussion — draft

### 7.1 The main contribution is the lifecycle around an equivalence assumption

The literature already contains strong state-comparison methods based on DOM structure, configurable comparators, fragments, hashing, embeddings, and learned classifiers. The StateScout results therefore do not justify presenting v4 as a universally superior classifier.

The more distinctive design choice is to represent a learned abstraction as an object with a lifecycle.

A conventional pairwise abstraction decision can be summarized as:

~~~text
observation A + observation B
        |
        v
same / different
~~~

StateScout instead asks how confidence in such an assumption should evolve:

~~~text
variation
  |
  v
quarantined candidate
  |
  v
cross-session evidence
  |
  v
behavior evidence
  |
  v
future-run promotion
  |
  v
trusted rule
  |
  v
freshness / challenge / revocation / restoration
  |
  v
current projection over preserved raw history
~~~

The controlled experiments provide evidence for several individual parts of that lifecycle. They do not establish that this exact lifecycle is uniquely optimal.

### 7.2 False merges deserve special treatment in an explorer

A false split mainly increases work: one meaningful state appears several times.

A false merge can be more damaging because it changes what the explorer believes has already been visited. Phase 13 demonstrates this asymmetry concretely: stale abstraction reduced known meaningful-state coverage from 1.0 to 0.5.

This motivates two conservative choices in StateScout: candidates begin quarantined rather than trusted, and a challenged rule is excluded from the next active profile before permanent revocation is required.

The cost is additional states and exploration work when evidence is uncertain. For a testing and exploration system, the project intentionally prefers that cost over silently hiding reachable behavior.

### 7.3 Observer completeness and abstraction precision are different problems

The Phase 17 and 18 content failures are not failures of v4's canonicalization rule. They occur because the production observer never records the meaningful changed text.

This distinction matters for future work. Improving the comparator cannot recover information that observation discarded.

The targeted-content condition reaches 16/16 on the frozen corpus, but promoting it directly into production would be premature. Arbitrary visible text can contain timestamps, ads, live counters, feeds, personalized content, user-generated text, and transient status messages.

A richer observer may therefore fix false merges while creating new false splits. The result identifies observer coverage as the next identity frontier; it does not justify fingerprinting all body text.

### 7.4 Run-frozen identity reduces self-modifying evaluation

If evidence collected during a crawl immediately changed the fingerprinter, the meaning of "same state" could change within the graph being constructed. Early and late parts of one run would then use different equivalence relations.

StateScout avoids this feedback loop by freezing identity at run start and applying learned evidence only to a future run.

This separation has two advantages: one graph is interpretable under one identity function, and offline promotion or revalidation artifacts can be audited independently of the browser traversal that produced their evidence.

The price is delayed adaptation: a run cannot immediately benefit from volatility it discovers. The experiments deliberately accept that delay for reproducibility.

### 7.5 Reversibility is not the same as retroactive completeness

The Phase 16 archive result can be misunderstood.

When revocation changes a three-state projection back to six states, StateScout has recovered recorded distinctions. It has not reconstructed actions or descendants that the earlier merged exploration never executed.

This is why the reversible archive and the Phase 13 conservative future crawl complement each other: the archive prevents loss of already observed evidence, while future exploration restores opportunities that stale abstraction may previously have suppressed.

A stronger future system could use historical split detection to schedule targeted recrawls of affected regions.

### 7.6 Selective revalidation turns abstraction maintenance into a resource-allocation problem

Once rules are defeasible, a practical system must decide which ones to verify.

Phase 15 is intentionally simple: it combines lifecycle urgency, age, conflict history, and estimated coverage impact into a transparent score.

That transparency is useful for an initial research artifact because every priority can be explained. However, the current score has two important limitations: weights were chosen rather than learned or optimized, and estimated coverage impact is supplied as metadata rather than inferred automatically from the exploration graph or archive.

The next research question is therefore not whether prioritization is possible, but how to estimate expected verification value from observed graph and evidence structure.

### 7.7 Safety policy changes the graph being measured

The Phase 19 public runs show large numbers of blocked interactions, especially on W3C's documentation-heavy example.

This is not merely an implementation detail. A conservative safety classifier defines which part of the application's action space the explorer is allowed to observe.

Consequently, public-site graph size should not be interpreted as the application's full state graph. It is the graph reachable under the observer, safe-only action classifier, same-origin restriction, attempt budget, current site content, and timing/network conditions.

This is why the paper reports public-site stability rather than real-world coverage percentages.

### 7.8 Temporal replication is informative rather than embarrassing

TodoMVC was unstable in the accepted Phase 19 run and stable in the later replication, while W3C remained graph-unstable and Selenium remained stable.

If the later run simply replaced the first, the artifact would hide exactly the kind of temporal variability that real web automation must tolerate.

The separation between frozen original evidence and later replication therefore becomes part of the methodology. It demonstrates that repeated-run graph structure is partly a property of the environment and time of observation, not only the crawler implementation.

### 7.9 Replay provides determinism but has visible depth cost

Replay makes BFS possible on one sequential browser page and provides a deterministic recovery mechanism. It also creates repeated work.

The Phase 20 linear benchmark makes that cost explicit: reaching sources at depths 0 through 31 produces 496 replay-step observations.

The single-run timing measurements are too noisy for an empirical complexity claim; synthetic timings are not monotonic across 64, 128, and 256 states. The structural replay count is stronger evidence because it follows directly from the restoration algorithm and controlled fixture.

Possible future mitigations include browser or session checkpoints closer to deep frontier states, multiple browser contexts, snapshot-aware restoration where supported, replay-prefix caching, and distributed frontier workers. Those are outside the frozen paper artifact.

### 7.10 Relationship to Judge, FragGen, WebEmbed, and Crawljax

StateScout should be interpreted as complementary to strong page-equivalence methods rather than as a demonstrated replacement.

Systems such as Judge and WebEmbed focus primarily on producing a better current equivalence decision. FragGen uses page fragments and learned application dynamism to improve abstraction and testing. Crawljax provides foundational state-flow crawling and configurable comparison mechanisms.

StateScout's candidate contribution is the governance layer around an abstraction assumption: evidence is accumulated without mutating the current run; trust is explicit and scoped; later evidence can challenge or revoke it; maintenance can be budgeted; and raw history survives the current projection.

An important future evaluation would combine the lifecycle architecture with alternative state classifiers and test whether lifecycle management provides value independently of the underlying pairwise representation.

### 7.11 What the results do not establish

The frozen evidence does not establish that:

- v4 is state of the art against Judge, FragGen, WebEmbed, or every modern baseline;
- the targeted-content observer generalizes beyond the 16-pair corpus;
- the volatility thresholds are statistically optimal;
- the Phase 15 scheduling weights are optimal;
- the real-world graphs represent complete application coverage;
- checkpointing provides crash-safe durable storage under power loss;
- the synthetic timing values establish asymptotic runtime behavior;
- StateScout solves arbitrary authenticated, canvas/WebGL, mobile, or highly personalized applications.

These boundaries are central to the paper's claim discipline rather than footnotes to be minimized.

### 7.12 Practical implication

For practitioners building stateful web explorers, the experiments suggest a design principle:

> Treat state equivalence as evidence-backed and revisable state, not as an irreversible preprocessing decision.

In concrete terms: retain raw observations when feasible, separate evidence collection from activation, scope dynamic-field assumptions to context, monitor assumptions for drift, fail conservatively when trust is uncertain, and make recovery and reproduction artifacts explicit.

Whether StateScout's exact implementation is the best realization of that principle remains an empirical question for larger independent studies.


## Remaining manuscript sections

8. Threats to validity  
9. Artifact and reproducibility  
10. Conclusion

Sections 4-7 are now drafted from the frozen Phase 21 artifact. The remaining sections should be completed without algorithm changes.


## Paper asset mapping

The current manuscript uses the following paper assets:

- **Figure 1:** `paper/figures/fig-lifecycle.svg` — conceptual abstraction lifecycle;
- **Figure 2:** `paper/figures/fig-phase18-ablation.svg` — generated from Phase 18 raw JSON;
- **Figure 3:** `paper/figures/fig-phase13-revocation.svg` — generated from Phase 13 raw JSON;
- **Figure 4:** `paper/figures/fig-phase16-reprojection.svg` — generated from Phase 16 raw JSON;
- **Table 1:** `paper/tables/table-phase18-ablation.md` — generated from Phase 18 raw JSON;
- **Table 2:** `paper/tables/table-phase20-recovery.md` — generated from Phase 20 raw JSON;
- **Table 3:** `paper/tables/table-lifecycle-summary.md` — synthesis of frozen lifecycle experiments;
- **Table 4:** `paper/tables/table-real-world-replication.md` — original Phase 19 result versus later replication.

Quantitative generated assets are built with:

```powershell
npm run paper:build-assets
```

The generator records input/output SHA-256 hashes in `paper/assets-manifest.json`.
