# Real-World Replication Log

## Purpose

Phase 19 evaluates public web applications whose availability and content can change outside StateScout.

For that reason, later executions are recorded as temporal replications rather than replacements for the original verified Phase 19 evidence.

The frozen algorithm/benchmark/test trees remain unchanged.

## Original verified Phase 19 result

The accepted Phase 19B result used the combined primary + recovery cohort:

```text
targets: 5
requested runs: 15
successful runs: 9
unavailable runs: 6
run-error runs: 0
evaluable targets: 3/5
study evaluable: true
stable initial targets: 2
stable graph targets: 1
```

Per-target stability:

| Target | Successful runs | Initial stable | Graph stable |
| --- | ---: | --- | --- |
| TodoMVC React | 3/3 | no | no |
| The Internet Dynamic Controls | 0/3 | not evaluable | not evaluable |
| UI Testing Playground Visibility | 0/3 | not evaluable | not evaluable |
| W3C APG Automatic Tabs | 3/3 | yes | no |
| Selenium Web Form | 3/3 | yes | yes |

This remains the primary Phase 19 result used in the consolidated paper summary.

## Replication — 2026-10-08

A later replication was run from the frozen Phase 21 artifact using:

```powershell
npm run research:rerun-real-world
```

Observed combined result:

```text
targets: 5
requested runs: 15
successful runs: 9
unavailable runs: 6
run-error runs: 0
evaluable targets: 3/5
study evaluable: true
stable initial targets: 3
stable graph targets: 2
```

Per-target replication:

| Target | Successful runs | Initial stable | Graph stable | States | Transitions |
| --- | ---: | --- | --- | --- | --- |
| TodoMVC React | 3/3 | yes | yes | 2-2 | 13-13 |
| The Internet Dynamic Controls | 0/3 | not evaluable | not evaluable | n/a | n/a |
| UI Testing Playground Visibility | 0/3 | not evaluable | not evaluable | n/a | n/a |
| W3C APG Automatic Tabs | 3/3 | yes | no | 5-6 | 36-47 |
| Selenium Web Form | 3/3 | yes | yes | 2-2 | 2-2 |

Aggregate transition statuses in the replication:

- TodoMVC: 3 observed, 36 blocked-by-policy, 0 failed, 0 no-state-change;
- W3C APG: 14 observed, 101 blocked-by-policy, 4 failed, 0 no-state-change;
- Selenium Web Form: 3 observed, 3 blocked-by-policy, 0 failed, 0 no-state-change.

## Interpretation

The replication does not invalidate the original Phase 19 result.

Instead it demonstrates temporal variability in a way the research design anticipated:

- TodoMVC changed from unstable initial/graph behavior to stable initial/graph behavior;
- W3C retained stable initial identity but continued to show graph instability;
- Selenium remained stable in both identity and graph structure;
- the same two primary public sites remained externally unavailable.

This supports the decision to keep real-world repeated-run evidence separate from controlled correctness benchmarks.

The correct paper interpretation is:

- public application observations are time-dependent;
- StateScout run-level failure remained zero in both recorded combined studies;
- repeated-run graph stability can vary across targets and across time;
- later replication should supplement, not overwrite, the frozen original evidence.
