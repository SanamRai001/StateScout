# StateScout Concepts

This document is intentionally educational. It records concepts that should be understood before they are hidden behind implementation details.

## Learning checkpoint 1 — Page vs state

A **page/route** is not the same thing as an application **state**.

Example:

```text
/orders
/orders + filter drawer open
/orders + Add Order dialog open
/orders + Details tab selected
```

All four may have the same URL while presenting meaningfully different choices to a user.

StateScout therefore explores **UI states**, not only URLs.

## Learning checkpoint 2 — Why a graph, not a tree

A state can expose any number of interactions:

```text
Dashboard
├── Orders
├── Tables
├── Reports
├── Settings
└── Profile
```

Also, multiple paths can lead to the same state:

```text
Dashboard -> Settings
Profile   -> Settings
```

A tree would duplicate Settings.

A graph represents the relationship correctly:

```text
Dashboard ----> Settings
                   ^
                   |
Profile -----------+
```

This is why StateScout's central data model is a directed graph.

## Learning checkpoint 3 — State vs snapshot vs fingerprint

These three terms must not be treated as synonyms.

### Real UI state

The actual condition of the running application.

We cannot store the entire reality perfectly.

### Semantic snapshot

The evidence StateScout chooses to capture:

- origin/path/query
- headings
- landmarks
- dialogs
- controls
- selected/expanded/checked state

### Fingerprint

A deterministic identity calculated from the normalized snapshot.

```text
real UI
   |
   v
semantic snapshot
   |
   v
normalization
   |
   v
canonical representation
   |
   v
SHA-256 fingerprint
```

The fingerprint is therefore an **abstraction**.

It can be wrong.

## Learning checkpoint 4 — The two fundamental state-equivalence errors

### False merge

Two meaningfully different states receive the same identity.

Example:

```text
State A: Delete confirmation dialog open
State B: No dialog
```

If our representation ignores dialogs, both might be treated as one state.

Consequence:

- missing states
- missing transitions
- incomplete workflows

### False split

Two semantically equivalent states receive different identities.

Example:

```text
State A: "Updated 10:31:04"
State B: "Updated 10:31:05"
```

If timestamps are included naively, the crawler may think every second creates a new state.

Consequence:

- graph explosion
- repeated exploration
- possible non-termination

A major StateScout research problem is finding a useful balance between these two errors.

## Learning checkpoint 5 — Interaction identity vs DOM identity

A brittle description:

```text
div:nth-child(4) > div:nth-child(2) > button
```

A semantic description:

```text
role=button
name="Create order"
context="Orders"
```

The second describes what the control means to the user rather than where it happens to live in the DOM.

This does not make semantic locators infallible. Duplicate accessible names, poor accessibility markup, or unlabeled custom controls can still create ambiguity.

## Learning checkpoint 6 — Transition

A transition is an **observation**, not an assumption.

```text
State A
  |
  | click "Open filters"
  v
State B
```

StateScout should record that executing a specific interaction while at State A produced State B.

The same-looking interaction in another state may produce a different result.

## Learning checkpoint 7 — Frontier

The **frontier** is the collection of known-but-not-yet-explored state/action pairs.

Conceptually:

```text
visited states = already understood
frontier       = things still worth trying
```

The crawler terminates when the frontier is empty.

This is much stronger than saying "stop when there are no more buttons on the current page."

## Learning checkpoint 8 — State restoration

Suppose Dashboard contains:

```text
Orders
Settings
Profile
```

After StateScout clicks Orders, it is no longer at Dashboard.

To explore Settings independently, it must restore Dashboard.

Initial strategy:

1. start a clean/reusable browser context;
2. restore authentication state;
3. replay the recorded interaction path;
4. verify expected fingerprints while replaying;
5. execute the next unexplored interaction.

Later we can optimize restoration with checkpoints.

## Learning checkpoint 9 — Safety classification is imperfect

Keyword classification such as:

```text
Delete -> destructive
Create -> mutating
Open -> safe
```

is only a first deterministic heuristic.

A button named "Continue" may charge a card.
A link named "Remove filters" is not destructive.

Therefore risk classification must eventually use context and conservative defaults.

Unknown actions should not execute automatically.

## Learning checkpoint 10 — Research mindset

Do not ask only:

> Does it work?

Also ask:

> Under what conditions does it fail?

For every algorithm StateScout introduces, look for:

- assumptions
- counterexamples
- false positives
- false negatives
- computational cost
- reproducibility
- alternative explanations

That habit matters more than publishing the first paper.
