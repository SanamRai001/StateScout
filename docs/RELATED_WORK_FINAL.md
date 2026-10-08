# Final Related-Work Review

## Status

This document replaces the initial engineering-oriented related-work map with a paper-facing literature review focused on StateScout's actual frozen contribution.

The review was updated after the Phase 21 research freeze. It therefore does not change the frozen algorithms, benchmarks, or tests.

The most important conclusion is negative but useful:

> StateScout must not claim novelty for state-flow graphs, automated GUI exploration, semantic/accessibility observations, near-duplicate state abstraction, learned state classifiers, or feedback-directed web exploration in general.

Those areas have substantial prior work.

The paper should instead position StateScout around **evidence-backed, cross-run, defeasible, and reversible semantic state abstraction**.

---

## 1. GUI ripping and event-flow models

Automatic GUI exploration and graph reconstruction predate StateScout by decades.

Memon, Banerjee, and Nagarajan introduced **GUI ripping**, dynamically traversing an executable GUI, extracting widgets and properties, and reverse-engineering models for test generation. Memon later consolidated GUI testing concepts into the **event-flow graph/model**, representing event interactions and supporting model-based test generation, coverage, oracles, and regression testing.

These works establish that automatically traversing a UI and constructing a graph of interaction possibilities is prior art.

### Implication for StateScout

StateScout cannot claim novelty for:

- graph-based GUI models;
- reverse-engineering a UI model from execution;
- event/action transitions;
- model-based GUI exploration.

Relevant references:

- Memon, Banerjee, Nagarajan. *GUI Ripping: Reverse Engineering of Graphical User Interfaces for Testing*. WCRE 2003. DOI: 10.1109/WCRE.2003.1287256.
- Memon. *An Event-Flow Model of GUI-Based Applications for Testing*. STVR 2007. DOI: 10.1002/stvr.364.

---

## 2. AJAX crawling and state-flow graphs

Mesbah, Bozdag, and van Deursen showed that AJAX applications break the traditional page/URL crawling model and proposed dynamically inferring a **state-flow graph** from client-side UI state changes. Their open-source Crawljax system established state-based crawling for rich web applications.

This is the closest foundational ancestor of StateScout's state graph.

Crawljax and related work also developed mechanisms to compare DOM states, replay interactions, and configure comparators that strip dynamic noise.

### Implication for StateScout

StateScout cannot claim novelty for:

- recognizing that one URL can contain multiple UI states;
- dynamically discovering event-driven state changes;
- using a state-flow graph for web exploration;
- replaying action sequences to restore a source state;
- removing known dynamic DOM noise before comparison.

Relevant references:

- Mesbah, Bozdag, van Deursen. *Crawling AJAX by Inferring User Interface State Changes*. ICWE 2008. DOI: 10.1109/ICWE.2008.24.
- Roest et al. *Regression Testing Ajax Applications: Coping with Dynamism*. ICST 2010. Oracle Comparator Pipelining is especially relevant because it strips known irrelevant differences such as dates, styles, and application-specific dynamic content before comparison.

### Important contrast

Crawljax's comparator pipelines are an important conceptual predecessor to StateScout's volatility work.

The difference is not simply that StateScout also removes noise.

The narrower StateScout question is whether a field should become abstract **only after scoped repeated evidence**, and whether that trust can later be challenged and revoked while preserving the original evidence.

---

## 3. Automated JavaScript/web exploration

ARTEMIS showed feedback-directed automated test generation for JavaScript applications using observed execution information such as event-handler registrations, coverage, and read/write sets.

FEEDEx later used feedback from code coverage, navigational diversity, and structural diversity to prioritize which state and event to explore in web applications.

WebMate automatically explores Web 2.0 applications and explicitly addresses interactive elements, state abstraction, replay/navigation, and nondeterminism.

These systems establish a broad prior-art space around dynamic exploration and feedback-guided action selection.

### Implication for StateScout

StateScout cannot claim novelty for:

- feedback-directed exploration in general;
- browser-driven automatic web testing;
- replay-based state navigation;
- state abstraction as a way to reduce redundant exploration.

Relevant references:

- Artzi, Dolby, Jensen, Møller, Tip. *A Framework for Automated Testing of JavaScript Web Applications*. ICSE 2011. DOI: 10.1145/1985793.1985871.
- Dallmeier, Burger, Orth, Zeller. *WebMate: A Tool for Testing Web 2.0 Applications*. JSTools 2012. DOI: 10.1145/2307720.2307722.
- Milani Fard, Mesbah. *Feedback-Directed Exploration of Web Applications to Derive Test Models*. ISSRE 2013. DOI: 10.1109/ISSRE.2013.6698880.

---

## 4. State abstraction and the false-merge/false-split problem

The state-equivalence problem is well established.

A state abstraction that is too strict creates redundant states and wastes exploration effort. A state abstraction that is too permissive merges distinct functionality and can reduce coverage.

This trade-off is central to prior web crawling, security scanning, model inference, and GUI testing work.

Ben-Bassat and Rokah used MinHash/locality-sensitive hashing over DOM structure to improve efficient near-duplicate detection for black-box web security testing.

TESTAR-related work has explicitly studied state-model inference through GUI exploration and the effect of different state abstractions.

A 2023 Journal of Systems and Software study further investigated distributed state-model inference and abstraction strategies for scriptless GUI testing.

### Implication for StateScout

StateScout must not present the false-merge/false-split trade-off itself as new.

Its contribution must concern **how abstraction decisions are formed, governed over time, and reversed**.

Relevant references:

- Ben-Bassat, Rokah. *Locality-Sensitive Hashing for Efficient Web Application Security Testing*. ICISSP 2019. DOI: 10.5220/0007255301930204.
- Mulders et al. *State Model Inference Through the GUI Using Run-Time Test Generation*. RCIS 2022. DOI: 10.1007/978-3-031-05760-1_32.
- Pastor Ricós et al. *Distributed State Model Inference for Scriptless GUI Testing*. Journal of Systems and Software 200 (2023), 111645. DOI: 10.1016/j.jss.2023.111645.

---

## 5. Adaptive abstraction refinement in GUI testing

Gu et al. introduced **APE**, a model-based Android GUI testing technique whose abstraction evolves during testing rather than remaining fixed. APE uses runtime evidence, including nondeterministic transitions and model-size pressure, to refine or coarsen a decision-tree abstraction. It records GUI trees/transitions and can rebuild the inferred model after an abstraction change.

This is important prior art for StateScout because it establishes that:

- dynamic abstraction refinement during GUI testing is not new;
- a testing model can be rebuilt from previously observed GUI history after the abstraction changes;
- both over-fine and over-coarse GUI models can be corrected during exploration.

Reference:

- Gu et al. *Practical GUI Testing of Android Applications via Model Abstraction and Refinement*. ICSE 2019, pp. 269-280. DOI: 10.1109/ICSE.2019.00042.

### Implication for StateScout

StateScout must not claim novelty for dynamic abstraction refinement, coarsening, or historical model rebuilding in isolation.

The narrower contrast is temporal and epistemic:

- APE adapts its abstraction **online within the testing run** to improve model precision/size;
- StateScout deliberately freezes the active identity function for a run and promotes or changes rule trust **between runs**;
- StateScout makes rule trust explicit through provenance, freshness, challenge, revocation, cooldown/restoration, and bounded selective revalidation.

The candidate contribution is therefore an explicit **cross-run rule-trust lifecycle**, not abstraction refinement itself.

---

## 6. Fragment-based and learned web-state abstraction

This is the strongest prior-work cluster relative to StateScout's state-identity experiments.

### FragGen

Yandrapally and Mesbah proposed **FragGen**, a fragment-based state abstraction for web apps.

FragGen rejects threshold-based whole-page comparison in favor of page fragmentation and combines structural and visual information. It uses fragment analysis for state equivalence, exploration diversification, and robust regression oracles.

Its evaluation used large state-pair datasets and reported substantially improved near-duplicate detection and model precision/recall.

This means StateScout cannot claim novelty merely for avoiding whole-page equality or for learning application dynamism during crawling.

Reference:

- Yandrapally, Mesbah. *Fragment-Based Test Generation for Web Apps*. IEEE Transactions on Software Engineering 49(3), 2023. DOI: 10.1109/TSE.2022.3171295.

### WebEmbed / neural embeddings

WebEmbed uses learned neural embeddings and threshold-free classification to identify near-duplicate web states and improve inferred web models and generated test coverage.

This is direct evidence that learned state-equivalence classifiers are prior art.

Reference:

- Kanaththage, Starace, Biagiola, Tonella, Stocco. *Neural Embeddings for Web Testing*. ICST 2026. DOI: 10.1109/ICST69053.2026.00056.

### Judge

**Judge** is especially important because it is recent and strong.

Judge frames ideal abstraction as grouping all-and-only pages with the same testing behavior. It uses a merge-and-classify architecture:

1. structurally merge repeated sibling subtrees while discarding text and attributes;
2. embed simplified DOMs using contrastive learning;
3. classify them in vector space.

Judge was evaluated against many baselines on manually labeled datasets and in guided exploration experiments.

Reference:

- Liu, Wang, Yang, Zhang, Xie. *Judge: Effective State Abstraction for Guiding Automated Web GUI Testing*. ACM Transactions on Software Engineering and Methodology 35(3), 2026. DOI: 10.1145/3736162.

### Implication for StateScout

After FragGen, WebEmbed, and Judge, the paper should **not** say:

- "StateScout introduces semantic state abstraction";
- "StateScout is the first to distinguish meaningful from dynamic web states";
- "StateScout introduces learned state equivalence";
- "StateScout is the first to use app-specific dynamism for state abstraction";
- "StateScout solves near-duplicate web-page detection."

Those claims would be too broad.

---

## 7. The 2026 empirical study on exploration and abstraction

Liu, Yang, Zhang, and Xie published a 2026 preprint studying automated web GUI testing across exploration strategies and six state abstractions.

The study compares model-based, reinforcement-learning, and LLM-based approaches and reports that state abstraction materially affects testing effectiveness, with no single exploration/abstraction design dominating all metrics.

This is highly relevant because it confirms that **state abstraction and exploration strategy interact**, and that evaluation should be multidimensional rather than reduced to one state-count or code-coverage number.

Reference:

- Liu, Yang, Zhang, Xie. *Understanding Automated Web GUI Testing: An Empirical Study Across Exploration Strategies and State Abstractions*. CoRR/arXiv:2606.16650, 2026. Preprint.

### Implication for StateScout

StateScout should explicitly acknowledge this study and avoid implying that one abstraction is universally optimal.

The StateScout paper is better framed around **governance of learned abstraction over time** than around a universal classifier leaderboard.

---

## 8. Accessibility-tree and semantic browser observations

Modern web-agent environments have normalized the use of accessibility trees as compact semantic observations.

WebArena exposes raw HTML, screenshots, and accessibility-tree observations. BrowserGym and WorkArena similarly provide rich browser observation/action spaces for agent research.

Therefore, accessibility roles/names and compact semantic browser observations are useful engineering choices but not novel by themselves.

Relevant references:

- Zhou et al. *WebArena: A Realistic Web Environment for Building Autonomous Agents*. 2023.
- Drouin et al. *WorkArena: How Capable are Web Agents at Solving Common Knowledge Work Tasks?* ICML 2024.
- Le Sellier de Chezelles et al. *The BrowserGym Ecosystem for Web Agent Research*. 2024/2025 ecosystem paper.

### Implication for StateScout

The paper may say that StateScout uses accessibility-oriented semantics as part of its operational state representation.

It should not claim that accessibility-tree/role-based observations are themselves a novel contribution.

---

## 9. Where StateScout is actually different

The reviewed literature contains many strong methods for deciding whether two current pages should be considered equivalent.

StateScout's most defensible distinction is that **equivalence is represented as a defeasible cross-run hypothesis with explicit evidence and lifecycle**, rather than only as the output of a comparator/classifier.

The frozen StateScout architecture includes:

1. **run-frozen identity**
   - observations collected during a run cannot silently mutate that run's state identity;
   - evidence can affect only a future run;

2. **quarantined volatility candidates**
   - variation alone is not sufficient for abstraction;

3. **behavior-backed promotion**
   - candidate fields require repeated evidence and stable downstream safe-probe behavior before trust;

4. **explicit provenance**
   - rules record whether they came from repeated observation or verified candidate promotion;

5. **offline revalidation**
   - later behavior can challenge or revoke a previously trusted abstraction;

6. **freshness-aware trust lifecycle**
   - trusted, challenged, revoked, cooldown, restored;

7. **bounded selective revalidation**
   - multiple trusted rules can be prioritized under a verification budget;

8. **preserved history under cross-run trust changes**
   - raw observations and transitions remain immutable;
   - later trust changes reproject historical evidence rather than deleting distinctions;
   - this is not claimed as model rebuilding novelty by itself, because APE already rebuilds models under changing abstractions;

9. **frozen evidence + temporal replication discipline**
   - external real-world reruns supplement rather than overwrite the accepted result.

### Literature-review-safe wording

A defensible statement is:

> In the reviewed web-GUI state-abstraction literature, we found extensive work on DOM-, visual-, fragment-, hashing-, and learned-classifier-based equivalence, but did not find a directly comparable architecture that models each learned abstraction rule as an explicit **cross-run trust object** with provenance, delayed promotion, freshness, challenge/revocation/restoration, selective revalidation, and application to preserved historical observations. APE is an important counterexample to any broader claim because it already performs online abstraction refinement/coarsening and model rebuilding.

This is deliberately narrower than a universal "first" claim.

It should remain phrased as "in the reviewed literature" unless a systematic review supports a stronger novelty claim.

---

## 10. StateScout should be positioned as a lifecycle architecture, not a classifier

A useful conceptual distinction for the paper is:

### Prior abstraction emphasis

```text
page A + page B
      |
      v
comparator / learned classifier
      |
      v
same state? yes/no
```

### StateScout emphasis

```text
observed variation
      |
      v
candidate quarantine
      |
      v
cross-session evidence
      |
      v
behavioral verification
      |
      v
future-run promotion
      |
      v
trusted abstraction
      |
      +--> freshness / challenge / revocation
      |
      +--> selective revalidation
      |
      +--> reversible historical reprojection
```

The contribution is therefore not merely the equality function.

It is the **lifecycle around equality assumptions**.

---

## 11. Relation to exploration robustness and checkpointing

StateScout also includes:

- same-origin and safe-only action policy;
- deterministic BFS over state/action work;
- replay restoration;
- digest-verified logical checkpoints;
- resumed-vs-uninterrupted graph equivalence.

These are valuable system properties and part of the artifact contribution.

However, they should not be the paper's primary novelty claim without a deeper dedicated literature review of crawler persistence, distributed exploration, and fault-tolerant testing systems.

The current paper should present them as **supporting operational contributions** that make the state-abstraction research reproducible and safely executable.

---

## 12. Final novelty boundary

### Established prior art — do not claim

- GUI ripping;
- event-flow/state-flow graphs;
- model-based GUI/web exploration;
- feedback-directed event selection;
- replaying UI paths;
- URL insufficiency for dynamic web apps;
- DOM similarity;
- state abstraction;
- near-duplicate detection;
- threshold-free fragment abstraction;
- learned/neural state classifiers;
- accessibility-tree browser observations;
- web-agent action spaces.

### Potential StateScout contribution — claim carefully

- abstraction evidence is collected without changing current-run identity;
- learned volatility is scoped to a protected semantic anchor;
- abstraction candidates are quarantined before promotion;
- promotion uses cross-session + behavior evidence;
- abstraction trust is explicitly defeasible across future runs;
- trust has freshness/challenge/revocation/recovery states;
- revalidation can be budgeted and selectively scheduled;
- raw historical observations remain immutable beneath the current equivalence projection;
- revocation can split earlier aliases without erasing or rewriting raw evidence;
- the complete lifecycle is experimentally evaluated from promotion through revocation, recovery, reversibility, and checkpointed exploration.

### Strongest paper framing

> **StateScout studies the lifecycle of semantic state abstraction, not merely the classification of page pairs.**

That framing is both more defensible against current literature and more faithful to the frozen artifact.
