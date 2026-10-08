# StateScout Research Freeze

## Freeze point

The research implementation is frozen at commit:

```text
d4aa27d4e2516555a30741f9829785b0db12316e
```

This commit is the Phase 20 squash merge on `main`.

The freeze exists to separate research evaluation from later product development and to prevent post-hoc algorithm tuning after the main benchmark results are known.

## Protected research trees

The freeze manifest protects the Git tree identities of:

- `src/` — algorithms, browser exploration, identity, policy, lifecycle, archive, checkpoint/recovery;
- `benchmarks/` — controlled fixtures, frozen labels, evaluation protocols, public-target manifests;
- `tests/` — correctness and regression suite used at the freeze point.

The machine-readable manifest is:

```text
research/freeze-manifest.json
```

Verify it with:

```powershell
npm run experiment:phase21
```

A successful verification must print:

```text
src: MATCH
benchmarks: MATCH
tests: MATCH
Research freeze intact: true
```

## What may still change

The following may be edited after the freeze:

- paper prose;
- result tables and figures;
- reproducibility documentation;
- citations and related-work discussion;
- non-algorithmic reporting scripts;
- formatting;
- release packaging.

These changes must not alter the measured research behavior.

## What may not change casually

After the freeze, do not change:

- semantic fingerprint implementations;
- observer semantics;
- action/crawl policy;
- volatility learning/promotion/revalidation/lifecycle behavior;
- selective revalidation logic;
- reversible archive semantics;
- BFS exploration/replay semantics;
- checkpoint/recovery semantics;
- benchmark labels or frozen expected outcomes;
- tests defining the accepted research behavior.

## Defect exception

A protected research tree may change only when a real correctness or benchmark-ground-truth defect is discovered.

If that happens:

1. document the defect before changing the result;
2. preserve the previous result and explain why it is invalid or incomplete;
3. create a new freeze baseline;
4. rerun every materially affected experiment;
5. update the paper's threats-to-validity and change log;
6. never silently replace an inconvenient negative result.

## Real-world reruns

Phase 19 uses external public applications.

Later reruns are allowed for replication, but they do not replace the original verified Phase 19 evidence.

A later public-site result may be reported as a replication or temporal follow-up because:

- availability changes;
- application content changes;
- browser/network conditions change;
- external sites are not controlled ground truth.

## Verified freeze environment

The final Phase 20 gate was verified on:

- Node.js v24.19.0;
- Windows x64;
- Chromium through Playwright;
- 75/75 tests passing;
- TypeScript strict typecheck passing.

The environment is part of the reproducibility record, not a claim that StateScout only works on Windows.

## Research state

At the freeze point, algorithm development stops.

The remaining work is research packaging:

- consolidate results;
- rerun controlled experiments for a final artifact;
- produce figures/tables;
- update related work;
- write methodology and findings;
- document limitations;
- release a reproducible paper artifact.
