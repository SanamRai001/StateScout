# Literature Search Log

## Purpose

This log records the literature-review pass used to revise StateScout's novelty claims after the Phase 21 research freeze.

It is not presented as a formal systematic literature review.

Its purpose is to make the paper's narrower phrase — **"in the reviewed literature"** — auditable.

## Search date

2026-10-08.

## Scope

The review focused on work relevant to:

- GUI ripping and event-flow modeling;
- AJAX/dynamic-web state-flow crawling;
- state abstraction and near-duplicate detection;
- replay/model inference for web testing;
- feedback-directed GUI/web exploration;
- scriptless GUI model inference;
- fragment-based state abstraction;
- learned/neural state abstraction;
- modern automated web GUI testing;
- accessibility-tree/semantic browser observations;
- web-agent environments where they overlap with StateScout's observation model.

## Search concepts

Representative search concepts included:

- automated web GUI testing state abstraction;
- dynamic web application state equivalence;
- AJAX crawler state-flow graph;
- GUI ripping event-flow testing;
- near-duplicate web states;
- Crawljax DOM comparison;
- WebMate state abstraction nondeterminism;
- scriptless GUI state model inference;
- fragment-based state abstraction web testing;
- neural embeddings web testing;
- effective state abstraction automated web GUI testing;
- exploration strategies state abstractions web GUI testing;
- accessibility tree web agent observation.

## Source preference

Where possible, bibliographic facts and technical claims were checked against:

1. publisher or conference pages;
2. institutional research portals;
3. DBLP;
4. author-hosted papers/repositories;
5. arXiv for preprints or open-access versions.

Secondary summaries were not used as the sole basis for a novelty claim.

## Seed works

The final related-work review explicitly includes the following core works.

### GUI model extraction

- Memon, Banerjee, Nagarajan — GUI Ripping, WCRE 2003.
- Memon — Event-Flow Model, STVR 2007.

### Dynamic web crawling

- Mesbah, Bozdag, van Deursen — Crawling AJAX / Crawljax, ICWE 2008.
- Roest et al. — regression testing AJAX applications / Oracle Comparator Pipelining, ICST 2010.
- Dallmeier et al. — WebMate, JSTools 2012.
- Milani Fard, Mesbah — FEEDEx, ISSRE 2013.

### Automated GUI exploration

- Artzi et al. — ARTEMIS framework, ICSE 2011.
- Mariani et al. — AutoBlackTest, STVR 2014.
- TESTAR state-model-inference work, RCIS 2022 and JSS 2023.

### Adaptive abstraction refinement

- Gu et al. — *Practical GUI Testing of Android Applications via Model Abstraction and Refinement*, ICSE 2019.
  - Material overlap discovered during citation chaining.
  - APE dynamically refines/coarsens GUI abstraction during testing and rebuilds the model from recorded GUI trees/transitions.
  - This invalidates any StateScout claim that dynamic abstraction refinement or historical model rebuilding is novel by itself.

### State abstraction / near duplicates

- Ben-Bassat, Rokah — MinHash/LSH state similarity, ICISSP 2019.
- Yandrapally, Mesbah — FragGen, IEEE TSE 2023.
- Kanaththage et al. — Neural Embeddings for Web Testing, ICST 2026.
- Liu et al. — Judge, ACM TOSEM 2026.

### Current synthesis

- Liu, Yang, Zhang, Xie — automated web GUI testing across exploration strategies and state abstractions, 2026 preprint.

### Adjacent modern browser-agent environments

- WebArena.
- WorkArena.
- BrowserGym ecosystem.

These are used primarily to establish that accessibility-tree/semantic browser observations and rich browser action spaces are established modern practice.

## Main review outcome

The search falsified several broad novelty formulations that appeared plausible earlier in the project.

### Rejected novelty claims

The paper should not claim first use or invention of:

- graph-based GUI/web exploration;
- state-flow graphs;
- URL-independent dynamic web state;
- replay-based navigation;
- state abstraction;
- near-duplicate page detection;
- app-specific handling of dynamic content in general;
- learned/neural state abstraction;
- fragment-based state abstraction;
- accessibility-tree observations.

### Remaining candidate gap

The review did not identify a directly comparable web-GUI state-abstraction system that combines all of:

- a run-frozen active identity function;
- quarantined candidate abstraction evidence;
- cross-run behavior-backed promotion;
- rule provenance;
- freshness-aware trust;
- explicit challenged/revoked/cooldown/restored states;
- selective revalidation under a fixed budget;
- immutable raw observations beneath the current alias projection;
- historical reprojection when abstraction trust changes, specifically as part of an explicit cross-run trust lifecycle rather than model rebuilding alone.

The paper therefore uses this lifecycle as its candidate novelty.

## Important 2026 correction

The final review must include **Judge** and the 2026 empirical study of exploration strategies/state abstractions.

Ignoring those works would materially overstate StateScout's novelty.

Judge in particular means StateScout should not be positioned as simply a new or better page-pair classifier.

## Search limitations

This review has limitations:

- it is not a PRISMA-style systematic review;
- it does not exhaust every security-crawling or model-inference paper;
- not every mobile-GUI abstraction paper was included;
- citation chaining is not yet exhaustive;
- some 2026 works are preprints or recently published and may evolve;
- no meta-analysis was performed.

Accordingly, the manuscript should use:

> "To our knowledge, in the reviewed literature..."

rather than:

> "StateScout is the first..."

until a more formal systematic search supports such language.

## Before submission

Before final submission:

1. continue backward/forward citation chaining from Judge, FragGen, WebEmbed, Crawljax, WebMate, APE, and the 2026 empirical study;
2. search the target venue's digital library;
3. verify final publication metadata for 2026 papers;
4. check whether any concurrent paper introduces explicit rule-level abstraction lifecycle/revocation/reversible history;
5. update `paper/references.bib`;
6. revise novelty wording if new overlapping work is found.
