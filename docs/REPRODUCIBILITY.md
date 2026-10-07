# Reproducibility Guide

## Freeze baseline

Research baseline:

```text
d4aa27d4e2516555a30741f9829785b0db12316e
```

Phase 21 adds only research packaging/reporting around this baseline.

## Requirements

Verified reference environment:

- Node.js v24.19.0;
- npm;
- Playwright Chromium;
- Windows x64.

The source is TypeScript/Node and is not intentionally Windows-specific.

## Install

```powershell
git clone https://github.com/SanamRai001/StateScout.git
cd StateScout

npm install
npx playwright install chromium
```

## Verify the research freeze

```powershell
npm run experiment:phase21
```

Expected:

```text
src: MATCH
benchmarks: MATCH
tests: MATCH
Research freeze intact: true
```

If a protected tree reports `DRIFT`, do not treat the run as reproducing the frozen paper artifact until the change is explained.

## Fast correctness gate

```powershell
npm run typecheck
npm test
npm run experiment:phase21
```

Frozen expected suite:

```text
75 tests
75 pass
0 fail
```

## Controlled research reproduction

The deterministic/local research suite is:

```powershell
npm run research:reproduce-controlled
```

This runs:

- strict TypeScript typecheck;
- complete test suite;
- Phase 8 broader generalization;
- Phase 9 observed volatility;
- Phase 10 candidate promotion;
- Phase 11 evidence persistence;
- Phase 12 offline promotion;
- Phase 13 revalidation;
- Phase 14 lifecycle;
- Phase 15 selective revalidation;
- Phase 16 reversible abstraction;
- Phase 17 broader corpus;
- Phase 18 baselines/ablations;
- Phase 20 scalability/recovery;
- Phase 21 freeze verification.

Phase 19 is deliberately excluded because it depends on public internet services.

## Real-world replication

To repeat the external study separately:

```powershell
npm run research:rerun-real-world
```

A real-world rerun is a replication, not a replacement for the original recorded Phase 19 evidence.

Possible outcomes include:

- target available;
- target externally unavailable;
- StateScout run error;
- graph instability.

The experiment records those outcomes separately.

## Result files

Experiment scripts write detailed JSON and compact text summaries under:

```text
results/raw/
```

Examples:

```text
phase-18-baselines-ablations.json
phase-19-real-world-evaluation.json
phase-20-scalability-recovery.json
```

The results directory is intended as generated evidence rather than hand-edited source.

## Reproduction order

Recommended order for a paper artifact reviewer:

1. verify freeze;
2. run typecheck;
3. run all tests;
4. run Phase 18 to inspect the main comparative table;
5. run Phase 20 to inspect recovery/scalability correctness;
6. optionally run the complete controlled reproduction;
7. optionally rerun Phase 19 with the understanding that external sites can drift.

## What not to do

Do not:

- edit ground truth after seeing reproduction failures;
- disable safety policy to increase public-site graph size;
- replace the recorded Phase 19 outcome with a later cleaner run;
- modify v4 or the observer and still call the result the frozen artifact;
- interpret a public-site outage as a semantic-identity failure.

## Paper-facing evidence

Use `docs/RESULTS_SUMMARY.md` for the consolidated verified results and `docs/THREATS_TO_VALIDITY.md` for limitations.

Use `docs/PROJECT_STATE.md` when phase-level implementation chronology or exact historical debugging context is required.
