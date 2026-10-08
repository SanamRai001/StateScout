# Anonymous StateScout Replication Artifact

This document is the submission-facing quick start for the anonymized StateScout artifact.

It intentionally omits author identity, personal repository URLs, personal domains, and local machine paths.

## Scope

The artifact supports the frozen StateScout experiments reported in the ICST 2027 submission.

The protected research baseline is identified by the freeze manifest rather than by an author-owned repository URL.

Protected research trees:

- `src/`;
- `benchmarks/`;
- `tests/`.

## Reference environment

Verified reference configuration:

- Node.js v24.19.0;
- npm;
- Chromium installed through Playwright;
- Windows x64.

The implementation is TypeScript/Node and is not intentionally Windows-specific.

## Install

From the anonymized artifact root:

```powershell
npm install
npx playwright install chromium
```

## Fast integrity gate

```powershell
npm run typecheck
npm test
npm run experiment:phase21
```

Expected:

```text
75 tests
75 pass
0 fail

src: MATCH
benchmarks: MATCH
tests: MATCH
Anonymous research snapshot intact: true
```

## Fast reviewer smoke test

```powershell
npm run artifact:smoke
```

This runs the strict typecheck, the complete 75-test suite, and anonymous freeze verification.

## Controlled reproduction

```powershell
npm run research:reproduce-controlled
```

This runs the deterministic/local research experiments used by the paper.

Public-site experiments are intentionally excluded because third-party availability can change.

## Public-site replication

Optional:

```powershell
npm run research:rerun-real-world
```

Treat this as a temporal replication.

A different public-site result does not replace the original recorded study.

## Included evidence and provenance

The anonymous package includes the controlled raw JSON outputs used for the paper's main quantitative claims:

```text
results/raw/phase-13-profile-revalidation.json
results/raw/phase-16-reversible-equivalence.json
results/raw/phase-18-baselines-ablations.json
results/raw/phase-20-scalability-recovery.json
```

Their SHA-256 digests and byte counts are recorded in:

```text
research/artifact-manifest.json
```

The package intentionally omits the paper-authoring scripts and manuscript source because they are not required to reproduce the research artifact.

## Expected controlled headline results

### State identity

```text
URL-only: 5/16
v4: 14/16
v4 without controls: 9/16
targeted-content diagnostic: 16/16
```

### Contextual abstraction

```text
trusted scoped v4: 6/6
false merges: 0
false splits: 0
```

### Defeasibility

```text
stale trusted coverage: 0.5
revoked coverage: 1.0
```

### Reprojection

```text
raw observations: 6
trusted projected states: 3
revoked projected states: 6
restored projected states: 3
raw archive digest unchanged: true
```

### Checkpoint recovery

```text
synthetic: interrupt 100 -> final 271 attempts
final states/transitions/failed: 256/271/16
resumed graph equals uninterrupted: true
corrupted checkpoint rejected: true

browser: interrupt 10 -> final 32 attempts
states/transitions: 33/32
replay-step observations: 496
resumed graph equals uninterrupted: true
```

## Interpretation boundary

The artifact does not claim:

- universal semantic equivalence;
- a state-of-the-art page-pair classifier;
- complete public-web coverage;
- optimal revalidation scheduling;
- machine-independent performance scaling.

The paper's narrower candidate contribution is the explicit cross-run trust lifecycle around learned abstraction assumptions.

## Double-anonymous handling

Before uploading the artifact for review:

- remove Git metadata or replace remote URLs;
- do not include an author-owned repository link;
- remove author-identifying PDF/file metadata;
- ensure archived paths do not reveal local usernames;
- keep the AI-use disclosure anonymous;
- inspect the final archive itself before upload.

The package builder performs its own identity-leak scan before completing.
