# StateScout CLI

The CLI is a thin usability layer over the frozen StateScout explorer. It does not change the frozen semantic-state algorithms.

## One-time setup

From the repository:

```powershell
git switch feat/statescout-cli-v1
git pull --ff-only

npm ci
npx playwright install chromium
npm link
```

After `npm link`, the `statescout` command is available from a normal terminal.

## Basic use

```powershell
statescout https://example.com
```

The scheme may be omitted:

```powershell
statescout example.com
```

For a local app:

```powershell
statescout localhost:3000
```

Localhost defaults to HTTP. Other scheme-less hosts default to HTTPS.

## Watch the browser

By default StateScout runs Chromium headlessly.

```powershell
statescout https://example.com --headed
```

This is the recommended first-use mode because you can watch which safe interactions StateScout executes.

## Bound the run

The CLI intentionally defaults to only 25 attempted safe transitions.

```powershell
statescout https://example.com --max-transitions 10
```

You can also adjust the Playwright action/navigation timeout:

```powershell
statescout https://example.com --timeout 20000
```

## Choose the output directory

```powershell
statescout https://example.com --output .\statescout-runs\example
```

Each run writes:

- `summary.json` — compact run summary;
- `graph.json` — semantic states and transitions;
- `checkpoint.json` — resumable logical exploration checkpoint;
- `observations.json` — browser observations captured during the run.

Without `--output`, StateScout creates a timestamped directory under `statescout-runs/`.

## Machine-readable terminal output

```powershell
statescout https://example.com --json
```

This prints the final summary as one JSON object, which is useful for scripts.

## Safety

The CLI intentionally keeps the research explorer's conservative defaults:

- same-origin only;
- safe interactions only;
- mutating interactions blocked;
- destructive interactions blocked;
- unknown-risk interactions blocked.

There is deliberately no CLI flag in v1 to disable these safety boundaries.

## Without npm link

You can also run the same CLI directly from the repository:

```powershell
npm run statescout -- https://example.com --headed
```

## Remove the global development command

If you no longer want the linked command:

```powershell
npm unlink -g statescout
```
