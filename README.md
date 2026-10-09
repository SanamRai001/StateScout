# StateScout

StateScout is an experimental open-source system for **semantic state-graph exploration of modern web applications**.

Instead of treating a web app as a list of URLs or relying on brittle DOM paths, StateScout aims to discover user-visible application states and the interactions that connect them using Playwright, accessibility semantics, graph exploration, state fingerprinting, screenshots, and safety-aware action policies.

## Project goals

StateScout is being developed as both:

1. a practical developer/QA tool for automatically mapping reachable UI workflows and detecting regressions; and
2. a reproducible research artifact for studying semantic web state abstraction and automated GUI exploration.

## Try StateScout from the terminal

A post-freeze CLI is available on `feat/statescout-cli-v1` so the explorer can be used directly without changing the frozen research algorithms.

```powershell
npm ci
npx playwright install chromium
npm link

statescout https://example.com --headed
```

StateScout stays same-origin and safe-only by default. Each run writes a semantic graph, checkpoint, observations, and summary under `statescout-runs/`.

See `docs/CLI_USAGE.md` for options and examples.

## Research direction

StateScout studies how a web explorer can identify meaningful UI states without relying on URL identity alone and without over-splitting equivalent states because of dynamic noise.

The frozen research artifact combines semantic state graphs, evidence-backed contextual volatility abstraction, defeasible trust, reversible historical equivalence, conservative same-origin exploration, deterministic replay, and checkpoint/resume.

The repository preserves both successful and negative experimental results; claims are limited to the measured benchmarks and real-world observations.

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
- `docs/RESULTS_SUMMARY.md`
- `docs/THREATS_TO_VALIDITY.md`
- `docs/REPRODUCIBILITY.md`
- `docs/PAPER_OUTLINE.md`
- `docs/RESEARCH_FREEZE.md`

## Status

**Phase 21 — research freeze and paper artifact**

Phases 0-20 are complete and merged. The research implementation is frozen at Phase 20 while the paper/reproducibility artifact is assembled.

Reference freeze commit:

```text
d4aa27d4e2516555a30741f9829785b0db12316e
```

Verify the frozen research trees with:

```bash
npm run experiment:phase21
```

Run the deterministic controlled reproduction suite with:

```bash
npm run research:reproduce-controlled
```

The public-site Phase 19 study is intentionally rerun separately because external availability can change.

## License

License selection is intentionally deferred until the dependency and reuse strategy is finalized.
