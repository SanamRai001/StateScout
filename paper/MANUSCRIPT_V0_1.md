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

## Remaining manuscript sections

4. StateScout design  
5. Experimental methodology  
6. Results  
7. Discussion  
8. Threats to validity  
9. Artifact and reproducibility  
10. Conclusion

These sections should now be drafted from the frozen Phase 21 artifact without algorithm changes.
