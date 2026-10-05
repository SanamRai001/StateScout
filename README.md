# StateScout

StateScout is an experimental open-source system for **semantic state-graph exploration of modern web applications**.

Instead of treating a web app as a list of URLs or relying on brittle DOM paths, StateScout aims to discover user-visible application states and the interactions that connect them using Playwright, accessibility semantics, graph exploration, state fingerprinting, screenshots, and safety-aware action policies.

## Project goals

StateScout is being developed as both:

1. a practical developer/QA tool for automatically mapping reachable UI workflows and detecting regressions; and
2. a reproducible research artifact for studying semantic web state abstraction and automated GUI exploration.

## Initial research direction

The current working hypothesis is that semantic state abstraction based on user-visible structure — such as routes, headings, dialogs, forms, accessible roles, names, labels, and other stable UI semantics — can reduce duplicate exploration and improve workflow discovery compared with simpler URL- or raw-DOM-based state representations.

This is a hypothesis to test, not a claimed result.

## Planned capabilities

- same-origin/domain-bounded crawling
- semantic interaction discovery
- graph-based state-space exploration
- duplicate/loop detection
- semantic state fingerprinting
- screenshot capture
- workflow graph generation
- mutation/destructive-action safety policies
- form understanding and deterministic test-data generation
- baseline vs current graph regression comparison
- optional AI fallback for ambiguous controls in later phases

## Research-first development

The repository will keep implementation decisions, experiment design, hypotheses, baselines, metrics, and threats to validity documented alongside the code.

See:

- `docs/PROJECT_VISION.md`
- `docs/RESEARCH_PROPOSAL.md`
- `docs/RELATED_WORK.md`
- `docs/EXPERIMENT_DESIGN.md`
- `docs/PROJECT_STATE.md`

## Status

**Phase 0 — research and architecture foundation**

No production crawler has been implemented yet.

## License

License selection is intentionally deferred until the dependency and reuse strategy is finalized.
