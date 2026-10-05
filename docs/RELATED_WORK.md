# Related Work

## Status

This is an **initial engineering-oriented related-work map**, not yet a systematic literature review.

Before a paper submission, this file must be replaced/expanded with a structured literature-search process and peer-reviewed references.

## Crawljax

Crawljax is the closest conceptual predecessor identified so far.

It dynamically explores JavaScript web applications and produces a state-flow graph whose nodes represent dynamic DOM states and whose transitions represent events.

Why it matters:

- confirms that state-graph crawling is established prior work;
- provides terminology and baseline ideas;
- means StateScout cannot claim novelty for “representing a website as a state graph.”

Research question for us:

Can semantic user-facing state abstraction and modern accessibility-oriented interaction identities improve state equivalence, robustness, safety, or regression usefulness?

Project:
https://github.com/crawljax/crawljax

## Playwright

Playwright is the proposed browser execution layer.

Its documentation recommends user-facing locators, especially role locators, and supports accessible names, labels, text, test IDs, and other strategies.

Why it matters:

StateScout should build interaction identity around semantic contracts rather than treating structural CSS/XPath as the primary locator.

Docs:
https://playwright.dev/docs/locators

## Crawlee

Crawlee provides browser-crawling infrastructure on top of Playwright/Puppeteer, including request queues and recursive crawling.

Why it matters:

It may reduce infrastructure work for URL/request scheduling, retries, persistence, and crawl orchestration.

However, StateScout's primary frontier is expected to contain **state/action exploration tasks**, not only unique URLs, so Crawlee's URL queue is not by itself the state-graph solution.

Docs:
https://crawlee.dev/

## State abstraction and near-duplicate detection

A core research area to review is how prior web crawlers decide whether two dynamic client-side states are equivalent or near-duplicates.

StateScout should compare its semantic representation with established DOM/state abstraction approaches rather than presenting this problem as new.

Literature review TODO:

- dynamic web crawling state abstraction
- near-duplicate DOM state detection
- model-based GUI testing
- automated event-flow exploration
- state equivalence in single-page applications
- GUI ripping
- web application test generation

## Browser agents and AI-assisted automation

Projects such as Stagehand, Browser Use, BrowserGym, and similar systems should be reviewed later for:

- action observation
- tool/action schemas
- browser-agent benchmarks
- visual/semantic fallback
- form reasoning

They are not planned as the deterministic core of Paper 1.

## Research gap discipline

The eventual paper must distinguish clearly between:

### Existing ideas

- state-flow graphs
- automated GUI crawling
- accessibility semantics
- browser automation
- DOM similarity
- visual regression
- graph traversal

### Candidate StateScout contribution

Still to be validated:

- a specific semantic state representation;
- a measurable state-equivalence improvement;
- a robust ranked interaction identity/resolution strategy;
- a safe state-space exploration policy;
- regression analysis over discovered semantic workflow graphs;
- a reproducible benchmark/evaluation methodology combining the above.

No novelty claim should be finalized until the formal literature review is complete.
