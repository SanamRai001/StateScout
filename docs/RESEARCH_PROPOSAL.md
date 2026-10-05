# Research Proposal

## Working title

**StateScout: Semantic State-Graph Exploration for Automated Web Application Testing**

This title is provisional.

## Research problem

Automated exploration of modern web applications must decide:

1. which visible elements are meaningful interactions;
2. whether an interaction produced a new application state;
3. whether a state has already been visited through another path;
4. how to restore or replay a path safely;
5. how to avoid unsafe or destructive actions.

URL identity is too coarse for many single-page applications, while raw DOM identity can be too sensitive to implementation-level noise.

## Research objective

Investigate whether a semantic representation of user-visible web UI state can improve automated workflow exploration and regression detection.

## Primary research questions

### RQ1 — State equivalence

How accurately can semantic state fingerprinting distinguish meaningful UI states compared with URL-based and DOM-based representations?

### RQ2 — Exploration efficiency and coverage

Does semantic graph exploration discover more meaningful states/workflows with fewer duplicate explorations than selected baseline approaches?

### RQ3 — Locator robustness

How robust are semantic interaction locators to common frontend refactorings compared with structural CSS/XPath-style locators?

### RQ4 — Optional later study: AI fallback

What additional coverage can an LLM or multimodal fallback provide on ambiguous or semantically poor interfaces, and what are its cost, latency, and reproducibility trade-offs?

RQ4 is intentionally outside the minimum first-paper scope.

## Initial hypotheses

These are hypotheses to test, not conclusions.

### H1

A semantic state fingerprint will reduce false-unique states caused by DOM noise compared with a normalized raw-DOM baseline.

### H2

A semantic state fingerprint will preserve more meaningful same-route UI distinctions than a URL-only baseline.

### H3

Role/name/label-oriented interaction identities will survive a larger proportion of non-semantic frontend refactorings than structural CSS/XPath locators.

### H4

Deduplicated graph exploration will reduce repeated traversal while retaining meaningful workflow coverage.

## Proposed semantic state representation

Candidate features:

- normalized origin and route
- visible headings
- landmarks
- dialogs
- forms and field semantics
- interactive roles and accessible names
- selected/expanded/checked state
- stable meaningful text
- optional normalized structural features
- optional visual fingerprint

The exact feature set must be established experimentally.

## Baselines

At minimum:

1. URL-only state identity
2. normalized DOM hash
3. StateScout semantic fingerprint

Potential external comparison, after reproducibility feasibility is assessed:

- Crawljax
- a basic Playwright crawler
- another open-source browser exploration framework

## Evaluation dimensions

- true distinct-state discovery
- false merge rate
- false split rate
- transition coverage
- workflow completion coverage
- duplicate exploration rate
- crawl duration
- browser actions executed
- locator survival under controlled mutations
- reproducibility across repeated runs
- blocked unsafe actions

## Benchmark strategy

Use a mix of:

- controlled synthetic applications with known ground truth
- open-source web applications pinned to exact commits
- controlled UI mutation variants

Ground-truth datasets are important because “more states found” is not automatically “better.”

## Scientific boundaries

StateScout must not claim novelty merely for:

- using a graph
- using Playwright
- using ARIA roles
- taking screenshots
- crawling buttons

The research contribution must be tied to a specifically defined state abstraction, exploration policy, evaluation method, safety model, or combination whose effect can be measured.

## Artifact goals

A publishable artifact should eventually contain:

- source code
- benchmark definitions
- exact application revisions
- experiment configs
- deterministic/random seeds where applicable
- raw results
- analysis scripts
- generated tables/figures
- environment setup
- paper/preprint

## Ethics and safety

Experiments should run on applications we own, local benchmark systems, or systems for which crawling/testing is explicitly authorized.

Production-facing destructive actions must not be executed by default.
