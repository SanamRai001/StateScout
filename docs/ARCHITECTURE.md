# Architecture — Phase 1A

## Scope

Phase 1A defines the deterministic exploration kernel before browser integration.

The core model must remain usable independently of Playwright so that state-equivalence and policy behavior can be tested without launching a browser.

## Core domain objects

### StateNode

Represents one discovered semantic UI state.

Contains:

- stable internal ID
- semantic snapshot
- fingerprint
- capture timestamp
- optional screenshot evidence

### Interaction

Represents one candidate user action.

Contains:

- interaction kind
- semantic target
- risk level
- ranked locator candidates

### Transition

Represents the observed result of attempting an interaction from a state.

A transition may be:

- observed
- blocked by policy
- failed
- no state change

### StateFingerprint

Versioned identity derived from a canonicalized semantic snapshot.

Versioning is important because changing the fingerprint algorithm can change graph topology.

## Semantic fingerprint v1

Current v1 inputs:

- origin
- path
- normalized/sorted query parameters
- page title
- headings
- landmarks
- dialogs
- semantic controls
- control state such as selected/expanded/checked/disabled

Normalization currently:

- collapses whitespace
- trims text
- lowercases origin and roles
- sorts unordered semantic collections
- hashes canonical JSON with SHA-256

### Important limitation

This is an intentionally simple **candidate algorithm**, not the final research contribution.

It currently does not understand:

- dynamic timestamps
- generated entity IDs
- equivalent text paraphrases
- visual-only state
- hidden-but-behaviorally-important state
- canvas/WebGL UI
- semantic importance weighting

These weaknesses are useful because they give us concrete hypotheses and benchmark cases.

## Crawl boundary v1

Default boundary:

```text
same origin only
```

If starting from:

```text
https://example.test/app
```

allowed:

```text
https://example.test/orders
https://example.test/settings
```

blocked:

```text
https://other.test/
mailto:...
tel:...
```

Subdomain/domain modes can be added later only with explicit policy.

## Action policy v1

Risk levels:

```text
safe
mutating
destructive
unknown
```

Default:

```text
safe        -> execute
mutating    -> block
destructive -> block
unknown     -> block
```

The initial keyword classifier is conservative and intentionally simple.

## Exploration frontier

The future crawler should queue **state + interaction work items**, not URLs.

Candidate shape:

```ts
interface FrontierItem {
  fromStateId: string;
  interaction: Interaction;
  replayPath: StatePath;
}
```

This distinction is essential.

Two interactions on the same URL may lead to different UI states.

## Initial traversal strategy

Start with breadth-first search (BFS).

Why BFS first:

- easier to debug;
- reaches shallow workflows quickly;
- replay paths remain shorter early in the crawl;
- produces understandable partial graphs.

DFS or priority-guided exploration can be compared later.

## State restoration v1

Initial reliable strategy:

```text
restore auth/session
      |
      v
replay path from root/checkpoint
      |
      v
verify intermediate state hashes
      |
      v
execute unexplored interaction
```

If an expected intermediate state cannot be reconstructed, record the replay failure instead of silently continuing from the wrong state.

## Storage

Do not introduce a database in Phase 1A.

The kernel should work with in-memory structures and JSON-compatible records first.

SQLite becomes justified when:

- crawls need durable resume;
- graphs become large;
- querying runs becomes important.

## Browser boundary

Playwright will be an adapter around the core, not the core itself.

Planned separation:

```text
core/
  model
  fingerprint
  policy
  graph/frontier

adapters/
  playwright/
    capture-state
    discover-interactions
    execute-interaction
    restore-state
```

This separation lets research experiments test algorithms without coupling every experiment to browser execution.


## Checkpoint and recovery architecture

Phase 20 adds durable-in-shape logical checkpoints without coupling the core to a database.

A checkpoint is composed of:

```text
ExplorationCheckpointArtifact
├── payloadSha256
└── payload
    ├── startUrl
    ├── attemptedTransitions
    ├── rootPath
    ├── StateGraphSnapshot
    ├── BfsFrontierSnapshot
    └── evidenceErrors
```

### StateGraph snapshot

The graph snapshot preserves all semantic states and transitions.

On restore, every stored state is re-fingerprinted using the fingerprinter supplied to the resumed run.

If the state ID, fingerprint hash, canonical representation, version, or algorithm no longer matches, restore fails.

This prevents silently resuming an old graph under a different identity policy.

### BFS frontier snapshot

The frontier snapshot preserves two separate concepts:

- pending FIFO work;
- every `(fromState, interaction)` key that has already been seen.

The full seen set must survive resume even when a work item has already been dequeued.

Otherwise a resumed crawl could execute previously consumed work again and change both cost and graph evidence.

### Checkpoint integrity

The checkpoint payload is SHA-256 hashed before serialization.

Parsing recomputes the digest and rejects modified payloads.

This protects against accidental file corruption or manual modification; it is not intended as an authenticated or adversarial cryptographic signature.

### Browser process is not checkpointed

StateScout does not serialize Chromium memory, DOM objects, JavaScript heaps, cookies, or an OS process snapshot.

Instead, after resume:

1. logical graph/frontier state is restored;
2. the next frontier item supplies its replay path;
3. Playwright navigates back to the configured start URL;
4. replay reconstructs the source semantic state;
5. intermediate state hashes are verified;
6. exploration continues.

This keeps checkpoints browser-independent in structure and makes browser recovery depend on the same replay correctness already used by normal BFS exploration.

### Current storage boundary

Checkpoint artifacts are JSON-compatible and can be written by callers.

Phase 20 does not introduce:

- SQLite;
- atomic filesystem checkpoint rotation;
- remote/object storage;
- distributed worker coordination.

Those become justified only after the checkpoint semantics themselves are experimentally verified.
