# StateScout Project Vision

## One-sentence vision

Give StateScout a web application and a safe crawl policy; it should discover the application's reachable semantic UI states, map the interactions between them, capture evidence, and make workflow/regression changes understandable.

## Problem

Modern web applications are not well represented by URLs alone.

A single route can contain many meaningful user-visible states:

- dialogs
- drawers
- expanded menus
- selected tabs
- multi-step forms
- inline editors
- table filters
- transient confirmations

Raw DOM snapshots are also unstable because implementation details such as generated class names, IDs, timestamps, ordering, wrappers, and framework rerenders can change without changing what a user perceives.

Traditional scripted browser tests are valuable, but they require a human to know and encode the workflow first.

StateScout explores whether a crawler can discover those workflows automatically.

## Core model

StateScout models an application as a directed graph:

- **node**: a semantic UI state
- **edge**: an interaction that transitions between states

The graph is not assumed to be a tree. Multiple paths may reach the same state, and cycles are expected.

## Design principles

### 1. User-visible semantics before implementation details

Prefer:

- role
- accessible name
- label
- meaningful text
- landmark
- heading
- form structure
- dialog context

over:

- DOM position
- generated CSS classes
- framework component names
- long XPath selectors

### 2. Deterministic core before AI

The first working crawler should not require an LLM.

AI may later be used for ambiguous interfaces, visual-only controls, poor accessibility markup, or semantic classification.

### 3. Safety is part of correctness

Autonomous exploration must distinguish between safe navigation and state-changing/destructive actions.

Default policy:

- safe/read-only actions: eligible
- mutating actions: disabled unless explicitly permitted
- destructive/high-risk actions: never executed by default

### 4. Evidence for every state

A discovered state should be explainable through structured metadata and, where enabled, a screenshot.

### 5. Reproducibility

Research results must be regenerable from versioned code, benchmark definitions, seeds/configurations, and raw experiment outputs.

## Non-goals for the first implementation

- replacing manually designed end-to-end tests
- fully autonomous production mutation testing
- solving arbitrary CAPTCHAs or bot defenses
- crawling unauthorized systems
- relying on proprietary AI services for core behavior

## Candidate CLI experience

```powershell
statescout crawl https://example.test --same-origin
statescout report ./runs/latest
statescout compare ./runs/baseline ./runs/latest
```

## Candidate output

```text
run/
├── graph.json
├── states.json
├── transitions.json
├── screenshots/
├── errors.json
└── report/
```

## Long-term product direction

A successful StateScout could become:

- an exploratory QA assistant
- a workflow documentation generator
- a UI regression mapper
- a Playwright test generator
- a benchmark platform for browser exploration algorithms
- an experimental environment for browser-agent research
