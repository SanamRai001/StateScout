# Minimal Benchmark Plan

## Why build our own first benchmark?

If we immediately crawl a large real application, we may see failures without knowing the correct answer.

A controlled benchmark gives us **ground truth**.

Ground truth means we know exactly:

- how many meaningful states exist;
- which actions connect them;
- which loops exist;
- which states intentionally share a URL;
- which states should be treated as equivalent despite DOM noise.

## Fixture 1 — Basic state graph

One local application should contain:

```text
Home
├── Open menu ----------> Menu Open
│                          └── Close ----> Home
├── Open dialog --------> Dialog Open
│                          ├── Cancel ---> Home
│                          └── Details --> Details
└── About -------------> About
                           └── Home -----> Home
```

Important properties:

- more than two children from Home;
- cycles back to Home;
- multiple states use the same URL;
- two paths can converge;
- safe actions only.

Expected ground truth is written manually before running StateScout.

## Fixture 2 — DOM noise

Create two renderings of the same semantic state where only irrelevant implementation details differ:

- wrapper div inserted;
- CSS class changed;
- generated ID changed;
- interaction order changed where user semantics remain equivalent.

Expected:

```text
same semantic state
```

This tests false splitting.

## Fixture 3 — Meaningful same-route change

Use one route where:

- dialog closed;
- dialog open;
- selected tab changes.

Expected:

```text
different semantic states
```

This tests false merging.

## Fixture 4 — Safety

Controls:

```text
Open settings
Create record
Delete record
Pay now
Continue
```

The "Continue" control should lead to a deliberately tricky context later, demonstrating why text-only risk classification is insufficient.

## Research discipline

For every fixture:

1. define expected states and transitions first;
2. commit the ground truth;
3. run algorithms afterward;
4. do not change ground truth to make StateScout appear better.

This prevents benchmark design from becoming unconsciously biased toward our algorithm.
