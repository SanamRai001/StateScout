# Project State

## Goal

Build StateScout as both:

1. a practical semantic web-application state explorer; and
2. a reproducible software-testing research artifact.

## Current phase

**Phase 0 — Research and architecture foundation**

## Branch

`docs/research-foundation-v0`

## Repository state before this phase

The repository was empty.

## Changes in this phase

- initialized repository README;
- documented project vision and non-goals;
- defined initial research questions and falsifiable hypotheses;
- defined baseline experiment families;
- created an initial related-work map;
- documented reproducibility and threats-to-validity requirements;
- explicitly avoided claiming novelty before formal literature review.

## Major architectural decisions

### Graph, not binary tree

UI exploration is represented as a directed graph because a state can expose many actions and multiple paths can converge on the same state.

### Component names are not required

StateScout will focus on user-visible semantics such as role, accessible name, label, form context, and stable interaction metadata rather than framework-internal component names.

### AI is not part of the deterministic core

Paper 1 should be possible without requiring an LLM.

### Safety is first-class

Mutation/destructive-action policies must exist before broad autonomous exploration.

## Verification performed

- GitHub repository metadata checked.
- Repository confirmed empty before initialization.
- Related technical direction checked against current Playwright locator guidance and Crawljax's state-flow graph model.

No implementation or runtime tests exist yet.

## Risks

- semantic state equivalence may still merge distinct states or split equivalent states;
- benchmark ground truth may be expensive to label;
- accessibility semantics may be poor on real applications;
- state replay may become expensive;
- async UI behavior can make results nondeterministic;
- novelty is not yet established by a systematic literature review;
- form mutation/destructive actions require strong safeguards.

## Acceptance criteria for Phase 0

- project purpose is explicit;
- research questions are measurable;
- hypotheses are falsifiable;
- baselines are documented;
- initial experiments are defined;
- novelty is not overstated;
- implementation has not prematurely locked the research design.

## Next phase

**Phase 1A — Deterministic exploration kernel design**

Before implementation:

1. define the `State`, `Interaction`, `Transition`, and `Fingerprint` schemas;
2. define same-origin/domain policy;
3. define safe/mutating/destructive action policy;
4. define state restoration/replay strategy;
5. define minimal synthetic benchmark application;
6. then implement the smallest crawler capable of:
   - opening one target;
   - discovering visible buttons/links;
   - executing one safe action at a time;
   - fingerprinting the resulting state;
   - recording nodes/edges;
   - terminating on exhausted frontier.

## Merge status

Not merged. Review the Phase 0 foundation before merging.
