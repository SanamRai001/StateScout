# StateScout: Critical Audit, Remediation Design & Phased Improvement Roadmap

**Audit date:** 29 October 2026  
**Repository:** [SanamRai001/StateScout](https://github.com/SanamRai001/StateScout)  
**Inspected default branch:** `main` at `89003cdbcd560fad0186900d6058c3b99b7089ec` (27 October 2026)  
**Also inspected:** `feat/statescout-cli-v1` at `2ebd8e585ad3302277da6b21e27e055e03860d56`; open draft PR [#26](https://github.com/SanamRai001/StateScout/pull/26)  
**Document status:** Proposed planning artifact; no product fixes are implemented or verified by this document  
**Repository document path:** `docs/STATE_SCOUT_AUDIT_AND_IMPROVEMENT_ROADMAP.md`  
**Research freeze:** `d4aa27d4e2516555a30741f9829785b0db12316e` (protect its scientific provenance)

---

## Executive decision

**Continue StateScout, but split its research and product tracks.** The research is centered on *defeasible, evidence-backed, cross-run semantic state abstraction*. The product should be a narrow, local-first **safe web-workflow discovery and regression-explanation tool**. Do not attempt to build a full browser-agent SaaS, a visually elaborate graph editor, or autonomous mutation testing before a secure and explainable local CLI succeeds on realistic staging applications.

**Immediate blockers:** (1) safe-looking controls can trigger side effects; (2) a same-origin link filter does not enforce a full browser boundary; (3) visible input values can flow into persisted evidence; (4) ambiguous controls can be clicked using `.first()`; and (5) an artifact packaging script recursively deletes an unconstrained output path. These are *source-confirmed hazardous behaviors or missing guards*, **not** evidence that exploitation or data loss has already happened. Treat them as deployment blockers until targeted adversarial tests establish the safety properties.

**Research integrity first:** the source/benchmark/test trees are frozen. Do not quietly patch them while continuing to label new outcomes as the original experiment. Record a defect exception and new freeze if a research correction is essential. Prefer a separate product branch and independently versioned product results.

**Target product promise:** “Point StateScout at an authorized local or staging application, explore within an enforceable safety policy, preserve trustworthy state/transition evidence, and explain meaningful workflow changes between runs.”

### Decision scorecard

| Dimension | Current assessment | Recommended direction |
| --- | --- | --- |
| Research question | Narrow, defensible lifecycle hypothesis; small evidence base | Preserve freeze; independent validation later |
| Engine architecture | Clear core/adapter separation; orchestration gaps | One modular Node.js process; explicit interfaces |
| Safety/privacy | Not ready for unrestricted autonomous exploration | Enforced runtime policy, redaction, sandboxing |
| Semantic correctness | Good controlled counters; observer misses content | Expand observer conservatively, test FM and FS |
| Locator correctness | Identically named targets can collapse; `.first()` | Resolve uniquely or report ambiguity |
| Replay/performance | Verified logical resume; expensive deep replay | Instrument, compare verified restore strategies |
| UX | No user-facing UI on main; separate development CLI | CLI first, static HTML report second |
| Product validation | Limited repeatability/coverage evidence in the wild | Realistic authorized app pilots and task-based tests |
| Repo/CI | Paper CI and branch CLI smoke; uneven product gates | Explicit merge checks, lockfile, support matrix |

## 1. Scope, methodology and evidence rules

The audit inspected repository metadata/tree, docs, implementation, tests, CI configuration, the separate CLI branch and draft PR status. It did **not** run code in the current environment, open a rendered product UI, conduct a penetration test, or reproduce the reported performance figures. The frozen project documentation records **75/75 passing tests** and prior controlled reproduction; that is historical evidence, not a fresh run by this audit.

Definitions used throughout:

- **SOURCE-VERIFIED:** a property can be established directly from the inspected source or repository tree. Example: `executeInteraction()` calls `.first().click()`.
- **RECORDED RESULT:** a benchmark, test or CI outcome stated in repository records or a workflow result. Example: the 16-pair evaluation or the CLI help smoke run.
- **RISK/HYPOTHESIS:** a plausible failure consequence not demonstrated with a failing test. Example: a misleadingly named destructive control could be classified as safe.
- **PROPOSAL:** target architecture, UX, test design or rollout process, not current functionality.
- **UNKNOWN:** requires reproduction, browser instrumentation, a clean installation or external verification.

Severity meaning: **P0 = block external or privileged product use**, **P1 = correctness/reliability required for useful MVP**, **P2 = design/quality improvement**, **P3 = later research/product enhancement**. The severity reflects *consequence if used as a product*, not a claim that an actual incident occurred.

**Terminology:** FM = false merge (different meaningful states treated as equivalent); FS = false split (equivalent states treated as different). A stable hash proves only consistency for the observed representation, not complete behavioral equivalence.

## 2. Product direction and architectural decisions

### DEC-01 — Separate research preservation and product development

Keep the paper freeze authoritative for paper results. Product work starts from an explicitly named branch and uses a product version or build identifier distinct from fingerprint protocol versions. If a shared engine defect affects frozen claims, document impact, preserve old results, rerun relevant experiments and create a new freeze before amending claims. Never re-label product improvements as frozen results.

### DEC-02 — Local-first, authorized-target-first MVP

Initially support `localhost`, developer-owned disposable staging environments, and synthetic fixtures. No arbitrary authenticated production crawling by default. Require explicit consent/configuration before any network interaction outside a allowlisted test target. A local runner reduces hosting, credential storage, and operating complexity.

### DEC-03 — One process with clear boundaries, not microservices

Suggested modules: **CLI/config** → **crawl orchestrator** → **browser adapter + enforceable policy** → **append-only evidence** → **state abstraction/projection** → **report/compare**. Keep a pure deterministic core. Use filesystem artifacts first; introduce SQLite only when indexed history, reliable resume, and concurrent read/write are demonstrably needed. No PostgreSQL, auth service, message broker or agents for MVP.

### DEC-04 — Results must explain uncertainty

Classify outcomes separately: *observed*, *blocked*, *failed*, *ambiguous*, *unreplayable*, *unknown*, and *changed*. A graph change cannot automatically be reported as an application regression: it may reflect timing, observer variance, locator ambiguity, policy, environment or trust-profile changes.

### DEC-05 — Human-readable evidence outranks graph spectacle

First deliver a useful CLI summary and offline HTML report with an accessible state list and causal change details. Add a graph view only where it improves investigation. Compare runs only after deterministic evidence contracts are solid.

### DEC-06 — Reuse-first delivery instead of recreating commodity tooling

**Default decision: reuse maintained open-source components before building a custom equivalent.** StateScout should own its domain-specific state identity, trust governance, graph semantics, cross-run comparison and uncertainty explanations. Playwright should own browser automation, tracing and robust locator primitives. Do not treat another project's feature list as an integration guarantee: verify its current API, license, transitive dependencies, isolation properties, performance and maintenance status before adoption. Each proposed dependency needs a small, disposable proof-of-concept (PoC), an explicit rejection option and a documented decision. See Section 12 for the reuse matrix, phase-by-phase implementation plan and acceptance gates.

## 3. Detailed issue register and remediation requirements

### Group A — Safety, security, privacy and destructive operations

#### SS-SEC-01 | P0 | Risk classifier can grant unsafe clicks

**Evidence (SOURCE-VERIFIED):** [`src/core/policy.ts` lines 64–85](https://github.com/SanamRai001/StateScout/blob/main/src/core/policy.ts#L64-L85) labels controls as `safe` based partly on keyword avoidance and button/link roles. [`src/browser/playwrightAdapter.ts` lines 167–181](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts#L167-L181) executes click actions. **Root cause:** action *labels* are treated as a safety signal; browser side effects are not independently constrained. “Continue”, “Archive”, “Disable user”, or a custom icon can have server-side effects. **Risk:** unauthorized mutation while ostensibly in safe mode.

**Fix design:** (1) define safety as a capability policy—what requests, methods, origins, state mutations and contexts are permitted; (2) deny or require approval for any action not demonstrably read-only; (3) use a disposable test environment and synthetic credentials; (4) block side-effecting network requests at the browser boundary where feasible and require server-side staging safeguards for actions that cannot be safely inferred; (5) log *why* each candidate was allowed, blocked or uncertain. Never claim request filtering alone can guarantee no mutation (GET endpoints can be badly designed; service workers and websocket effects complicate semantics).

**Adversarial tests:** controls titled “Continue”, “Archive”, an icon-only confirm action, a GET endpoint that mutates, a JS `fetch(POST)` triggered by a button, an async side effect after click. **Acceptance:** no known mutating fixture causes a state-changing request or durable side effect in safe mode; ambiguous actions are blocked or explicitly approved; an audit trail explains every decision. **Trade-off:** conservative blocks reduce exploration coverage by design.

#### SS-SEC-02 | P0 | Same-origin boundary is a link-discovery filter, not a complete browser invariant

**Evidence (SOURCE-VERIFIED):** [`explorer.ts` lines 119–176](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts#L119-L176) checks known `navigate` targets before queueing. `executeInteraction()` can click a button that redirects, opens a popup or initiates cross-origin requests. **Root cause:** origin policy does not own the browser context or all navigation/network events. **Risk:** a safe-labeled interaction may leave the intended origin.

**Fix design:** enforce navigation, popups and requests through a single browser-context policy; reject disallowed main-frame destinations and redirects, define subresource rules, and validate the actual page URL after every action. Distinguish *navigation containment* from *network isolation*. Preserve legitimate CDN resources using explicit restrictions rather than assuming all cross-origin subresources are automatically unsafe. Record blocked targets without following them.

**Tests:** same-origin anchor, redirected anchor, `window.location` on button click, `window.open`, form submit, iframe and service-worker/network attempt. **Acceptance:** forbidden top-level navigation and popups cannot become explored states, and every exception is explicitly configured and logged.

#### SS-SEC-03 | P0 | Secrets may be included in semantic snapshots and artifacts

**Evidence (SOURCE-VERIFIED):** [`playwrightAdapter.ts` lines 76–112](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts#L76-L112) reads visible input `.value`; [`explorer.ts` lines 244–349](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts#L244-L349) retains and exports snapshots; the [CLI development branch](https://github.com/SanamRai001/StateScout/blob/feat/statescout-cli-v1/cli/statescout.ts#L202-L257) writes `graph.json`, `checkpoint.json`, and `observations.json`. **Root cause:** collection and serialization have no mandatory privacy minimization boundary.

**Fix design:** provide *redacted snapshot* and *raw in-memory observation* as different types. Redact password, token, authorization, secret/credential patterns, and configured PII before hashing, logs, checkpoints or screenshots. Consider sensitive query strings and page title; allow opt-in field hashing when identity requires equality without disclosure. Use strict default file permissions where possible, a retention/deletion policy, and explain that screen content may include sensitive data. Avoid ever serializing browser storage state in report artifacts unless explicitly needed and protected.

**Tests:** password input, API token textbox, email/phone, sensitive query parameter, authorization error, screenshot containing test secrets. **Acceptance:** synthetic sentinel secrets are absent from all output files, error messages and reports; redaction does not silently erase critical state identity without marking reduced fidelity.

#### SS-SEC-04 | P1 | Ambiguous targets can be clicked via `.first()`

**Evidence (SOURCE-VERIFIED):** [`playwrightAdapter.ts` lines 36–40](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts#L36-L40) builds interaction IDs without structural container scope; [`lines 167–181`](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts#L167-L181) select the first role/name, test ID or text match. **Root cause:** target *meaning* and target *instance* are conflated. **Risk:** repeated “Details”, “Remove”, “Edit” actions in table rows collapse or click the wrong row.

**Fix design:** capture semantic container lineage (dialog, region, row label, list item identifier), prefer scoped Playwright locators, verify `count() === 1` and visibility/actionability, and return an explicit `AMBIGUOUS_TARGET` transition when uniqueness cannot be established. Keep a controlled fallback strategy with confidence/evidence, not silent `.first()` selection.

**Tests:** two rows with identical “Details”, duplicated modal/footer buttons, reorder after rerender, duplicate accessible names and shadow-DOM cases. **Acceptance:** the intended row is reached, otherwise the action is safely skipped with a diagnostic; no wrong-row mutation is accepted as a pass.

#### SS-SEC-05 | P0 | Artifact builder can recursively delete an arbitrary resolved output directory

**Evidence (SOURCE-VERIFIED):** [`paper/analysis/build-anonymous-artifact.ts` lines 19–21 and 63](https://github.com/SanamRai001/StateScout/blob/main/paper/analysis/build-anonymous-artifact.ts#L19-L21) resolves optional output input and `rmSync(OUT, { recursive: true, force: true })` without proving `OUT` is an approved generated-artifact directory. **Root cause:** a build destination parameter is a deletion authority. **Risk:** accidental loss of unrelated files if an unsafe path is passed.

**Fix design:** require output under a dedicated generated-artifacts root, reject filesystem/project roots, repository ancestors, symlink escapes and paths outside approved root, and refuse replacement without a generated marker and explicit safe overwrite. Test with a temporary sentinel folder; never run risky test cases against real user directories. **Acceptance:** unsafe destinations fail before any deletion; ordinary packaging stays functional.

#### SS-SEC-06 | P1 | No documented data classification, retention or safe sharing policy

**Evidence (SOURCE-VERIFIED for absence in inspected entrypoints; POLICY GAP):** artifact outputs contain snapshots and URLs; the CLI usage guide does not define sensitive-data handling or retention. **Root cause:** research artifacts were treated as benign generated JSON. **Fix:** define run manifests (`containsSensitiveData`, redaction version, target allowlist, retention), opt-in screenshot capture, an export safety checklist and `.gitignore` coverage for `statescout-runs/`. **Acceptance:** default run artifacts cannot be committed accidentally, document retention choices and pass sentinel-secret checks.

### Group B — Semantic observation, identity and exploration correctness

#### SS-ID-01 | P1 | Product default is fingerprint v1 while main research uses v4

**Evidence (SOURCE-VERIFIED):** [`explorer.ts` line 185](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts#L185) chooses `fingerprintState` (v1) absent an override. The CLI development branch passes no custom fingerprinter in its call to `exploreWithPlaywright()`. Phase 19 explicitly supplies v4. **Risk:** users believe they are running the researched abstraction when using the default CLI.

**Fix:** introduce explicit `identityStrategy` and profile metadata in product config (`v1`, `v4-empty`, `v4-with-validated-profile`); reject unknown versions; state the chosen identity in output. A product default may be v4 only after regression tests establish that this is operationally appropriate; do not change the frozen default silently. **Acceptance:** every report declares fingerprint version/profile digest and compatibility checks reject incomparable runs.

#### SS-ID-02 | P1 | Observer misses meaningful visible status and list content

**Evidence (RECORDED RESULT):** [`docs/RESULTS_SUMMARY.md` lines 202–239](https://github.com/SanamRai001/StateScout/blob/main/docs/RESULTS_SUMMARY.md#L202-L239) records two v4 false merges from ordinary status/list text outside the observer. **Root cause:** `SemanticStateSnapshot` includes selected controls/headings/landmarks/dialogs, not all meaningful content. **Risk:** differences relevant to users are treated as one state.

**Fix:** add bounded, context-aware content tokens for status/live regions, selected table/list summaries, and important form-validation feedback. Prefer role/region structure with configurable selectors over full-body text hashing. Measure both additional FM protection and FS inflation under clocks, feeds, loading text, IDs and localization. **Acceptance:** the two frozen failure classes are detected on *new product tests* without unacceptable noise on independent fixtures. Keep frozen research benchmarks immutable.

#### SS-ID-03 | P2 | Sorting semantic collections can erase meaningful order

**Evidence (SOURCE-VERIFIED):** [`fingerprintV4.ts` lines 26–35 and 92–105](https://github.com/SanamRai001/StateScout/blob/main/src/core/fingerprintV4.ts#L26-L35) normalizes/sorts text collections and controls. **Risk:** reordered wizard steps, priority lists or ordered content may hash equivalently where order is meaningful. **Fix:** assign order semantics only to relevant regions (`list`, `tablist`, `stepper`, sorted column) rather than globally preserving or ignoring order. **Tests:** semantically significant order swap versus irrelevant DOM wrapper/reorder. **Acceptance:** explicit measured policy for order-sensitive cases with FM/FS results.

#### SS-ID-04 | P2 | Global tracking-query omission contradicts context-dependent thesis

**Evidence (SOURCE-VERIFIED):** [`fingerprintV4.ts` lines 67–89](https://github.com/SanamRai001/StateScout/blob/main/src/core/fingerprintV4.ts#L67-L89) skips known tracking keys unconditionally. **Risk:** an application can legitimately use a conventional query parameter to alter content. **Fix:** treat the global omission as a documented heuristic and test against deliberately meaningful `utm_source`/`gclid` usage; longer term prefer app-specific allowlist or evidence-backed rules. **Acceptance:** configuration is explicit and the benchmark records the trade-off.

#### SS-ID-05 | P1 | Interaction model advertises unimplemented action types

**Evidence (SOURCE-VERIFIED):** [`src/core/model.ts`](https://github.com/SanamRai001/StateScout/blob/main/src/core/model.ts) declares `fill`, `select`, `check`, `uncheck`, `press`, `upload`; [`playwrightAdapter.ts` lines 141–181](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts#L141-L181) mostly discovers click/navigation and unconditionally clicks on execution. **Risk:** misleading API contract and inability to explore meaningful form flows.

**Fix:** for MVP, explicitly mark supported actions `click`/`navigate` and expose `unsupported` evidence for the rest. Later add safe deterministic input generation for allowed fields, documented test-data scope and a rollback/reset mechanism. Never enable submit/upload merely because type support exists. **Acceptance:** runtime action capabilities match CLI/docs and are covered by tests.

#### SS-ID-06 | P2 | First observation after action may capture an unstable intermediate state

**Evidence (CODE-LEVEL HYPOTHESIS):** [`explorer.ts` around line 305](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts#L305-L315) executes and immediately observes. It does not define an application-specific settled-state contract for async transitions. **Risk:** transient loading states create noisy graphs or replay failures.

**Fix:** add a bounded stability observer (e.g., repeated semantic snapshots with quorum, explicit ready signals when available, max stabilization duration) and preserve transient-state evidence separately when meaningful. Avoid waiting blindly for `networkidle` as a universal criterion. **Acceptance:** deterministic async-control fixtures succeed across repeated runs without hiding actual loading/error states.

### Group C — Architecture, persistence and performance

#### SS-ARC-01 | P1 | Research lifecycle modules are not an integrated product workflow

**Evidence (SOURCE-VERIFIED):** `src/core` contains candidate/volatility/trust/reprojection modules, but ordinary [`exploreWithPlaywright()`](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts) does not coordinate their complete cross-run use. **Risk:** an impressive collection of research functions with no easy, reliable human workflow.

**Fix:** add a lightweight application orchestrator with explicit stages: `run -> collect -> validate -> quarantine -> offline promote/revalidate -> project -> compare -> report`. Define artifact schemas and versioned compatibility rules. Keep trust updates offline and prohibit mutation of an active run’s fingerprinter. **Acceptance:** one scripted integration test demonstrates a full two-run lifecycle, including trust challenge/revocation and unchanged raw evidence.

#### SS-ARC-02 | P1 | Deep replay has structural repeated-work growth

**Evidence (RECORDED RESULT):** Phase 20 records depth 32 and 496 replay-step observations in [`docs/RESULTS_SUMMARY.md`](https://github.com/SanamRai001/StateScout/blob/main/docs/RESULTS_SUMMARY.md#L290-L329). **Root cause:** restore-from-root replay repeats previous actions for every frontier step. **Risk:** slow workflows and increased flakiness on larger applications.

**Fix:** instrument replay steps and durations per transition; establish baseline; compare root replay with verified saved context, application-provided reset hooks and checkpoint-assisted restoration. Retain correctness checks and fallback to root replay on mismatch. **Acceptance:** a measured strategy reduces work on deep fixtures while reproducing the same verified states and transitions under controlled trials.

#### SS-ARC-03 | P2 | Canonical graph edges are not an append-only attempt log

**Evidence (SOURCE-VERIFIED):** [`src/core/graph.ts` lines 40–52 and 168–209](https://github.com/SanamRai001/StateScout/blob/main/src/core/graph.ts#L168-L209) deduplicates a transition keyed by source, interaction, destination, status and error. **Risk:** retries and repeat attempts can collapse, obscuring run diagnostics.

**Fix:** separate `AttemptEvent` (unique ID, timestamp, action, source, outcome, error/latency, evidence refs) from deduplicated `GraphTransition`. **Acceptance:** repeated identical attempts produce separate auditable events but one canonical edge.

#### SS-ARC-04 | P2 | Checkpoints are logically sound but not crash-durable

**Evidence (SOURCE-VERIFIED / DOCUMENTED LIMIT):** [`src/browser/explorationCheckpoint.ts`](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorationCheckpoint.ts) handles payload hashing; docs explicitly note no atomic filesystem rotation, process snapshot or DB durability. **Risk:** partial file writes or interrupted persistence can lose progress. **Fix:** versioned manifest, write-temp/fsync/rename where supported, previous-good checkpoint fallback, size limits and explicit integrity errors. Ensure saving never blocks the browser for long unbounded intervals. **Acceptance:** simulated interruption during write recovers from a prior-good checkpoint and never silently loads malformed data.

#### SS-ARC-05 | P2 | Evidence callbacks can remain in-memory or fail without first-class status

**Evidence (SOURCE-VERIFIED):** [`explorer.ts` lines 224–240](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts#L224-L240) calls a synchronous observation sink and records thrown errors; the callback contract is not an awaited durable persistence boundary. **Risk:** consumers can assume a callback means data is durably saved when it does not. **Fix:** distinguish best-effort telemetry from guaranteed evidence writes, support bounded async persistence with backpressure or post-run commit, record partial/incomplete artifacts. **Acceptance:** failure injection produces explicit `evidenceIncomplete` state and no false “complete” report.

#### SS-ARC-06 | P2 | Dataset and policy versioning need stronger run compatibility contracts

**Evidence (DESIGN GAP):** fingerprints are versioned, but the product output has no uniform contract combining observer version, redaction rules, locale, browser settings, trust-profile digest and action policy. **Fix:** define `RunManifest v1` with source commit/product version, browser build, policy digest, observer/fingerprint/profile versions, target, timestamps, completion/partial status and evidence checksums. **Acceptance:** comparisons reject or explain version mismatches instead of silently treating them as application changes.

### Group D — UI, UX and product workflow

#### SS-UX-01 | P1 | No end-user UI on `main`; developer CLI is isolated on a divergent branch

**Evidence (SOURCE-VERIFIED):** `main` contains no React/web frontend or CLI binary; the [development CLI](https://github.com/SanamRai001/StateScout/blob/feat/statescout-cli-v1/cli/statescout.ts) exposes `statescout <url>`, `--headed`, `--output`, `--json`; the branch diverges from `main`. **Fix:** after safety review, extract only required CLI changes onto a product branch, lock dependencies, and ship a documented local fixture quick start. **Acceptance:** a new contributor can install and crawl an authorized fixture without editing project code.

#### SS-UX-02 | P1 | JSON-only outputs do not explain the result to developers

**Evidence (SOURCE-VERIFIED):** CLI branch writes summary/graph/checkpoint/observations JSON; main project vision describes the report as a candidate. **Risk:** the user must understand graph internals to determine why something changed. **Fix:** produce a static, accessible offline HTML report with high-level findings; state inventory; action path; policy decisions; evidence; errors and uncertainty. **Acceptance:** a reviewer identifies the cause of a seeded workflow difference using only the report in a short usability exercise.

#### SS-UX-03 | P1 | Baseline-versus-current regression comparison remains a planned capability

**Evidence (SOURCE-VERIFIED):** [`PROJECT_VISION.md` lines 91–120](https://github.com/SanamRai001/StateScout/blob/main/docs/PROJECT_VISION.md#L91-L120) describes candidate `compare`, while main has no integrated product compare command. **Fix:** design comparison around manifest-compatible semantic states and transitions; classify additions/removals, behavior changes, and uncertain/replay-failed observations separately. **Acceptance:** seeded regression is detected, while timing differences and policy blocks are not mislabeled application defects.

#### SS-UX-04 | P2 | A graph-only interface would become unusable at scale

**Evidence (DESIGN CRITIQUE, not existing UI defect):** product goal centers on graphs but does not specify scalable navigation. **Fix:** prioritize searchable tables, workflow grouping, filters, path breadcrumbs, evidence drawer and state summaries; graph only as a secondary explainer. Use semantic HTML, keyboard controls and text alternatives. **Acceptance:** keyboard-only user can inspect every critical finding without interacting with graph graphics.

#### SS-UX-05 | P2 | Feature presentation must distinguish shipped and aspirational capability

**Evidence (SOURCE-VERIFIED):** `README.md` lists screenshots, forms, comparison, reports and AI fallback under planned capabilities. **Fix:** create `Implemented / Experimental / Planned / Non-goals` sections and show concrete limitations/safe-target warnings in the CLI help and report. **Acceptance:** no documentation example claims to execute a feature absent from the product branch.

### Group E — Engineering quality, evidence and repository management

#### SS-QA-01 | P1 | CI and scripts do not define one reliable product gate

**Evidence (SOURCE-VERIFIED):** [`package.json` line 13](https://github.com/SanamRai001/StateScout/blob/main/package.json#L13) names `test:browser` but runs only `playwrightAdapter.test.ts`; `.github/workflows/paper-build.yml` is a paper job, while the CLI branch workflow typechecks and invokes `--help`. **Fix:** add purpose-specific scripts (`test:unit`, `test:browser:smoke`, `test:browser:full`, `test:safety`, `verify:product`) and required CI checks. **Acceptance:** representative crawl, same-origin and sentinel-secret tests run in CI against local fixtures, plus freeze verification where applicable.

#### SS-QA-02 | P1 | Main checkout lacks checked-in package lock

**Evidence (SOURCE-VERIFIED):** inspected main tree lacks `package-lock.json`; development CLI branch has one. **Risk:** variable dependency resolution undermines repeatability and `npm ci` bootstrap. **Fix:** commit and review lockfile on product branch, use `npm ci` in CI and release instructions, pin Node/Chromium versions for reproducible tests. **Acceptance:** clean Windows and Linux install/build paths are documented and validated.

#### SS-QA-03 | P2 | Current documentation has historical drift and is hard to navigate

**Evidence (SOURCE-VERIFIED):** [`docs/ARCHITECTURE.md`](https://github.com/SanamRai001/StateScout/blob/main/docs/ARCHITECTURE.md) begins as a Phase 1A specification; `docs/PROJECT_STATE.md` is ~114 KB. **Fix:** retain historical research notes separately, keep **one** concise `docs/PROJECT_STATE.md` for live state (branch/HEAD, decisions, tests, risks, next phase), add a current architecture map and one canonical runbook. Do not create parallel status trackers. **Acceptance:** a new contributor can identify entrypoint, contract ownership, accepted decisions and current milestone from the first two documentation links.

#### SS-QA-04 | P2 | Numerous historical branches increase maintenance risk

**Evidence (SOURCE-VERIFIED):** repository branch listing includes more than 30 phase/paper/CLI branches, and open draft [PR #26](https://github.com/SanamRai001/StateScout/pull/26). **Fix:** first classify by merge ancestry, open PR references, needed research provenance and local worktree dependencies; tag important refs, archive evidence, only then propose deletion with explicit approval. **Acceptance:** every deletion candidate has documented merge/provenance evidence. Never delete branches as a side effect of implementing this plan.

#### SS-QA-05 | P1 | Anonymous artifact portability requires end-to-end verification

**Evidence (RECORDED):** open [PR #26](https://github.com/SanamRai001/StateScout/pull/26) documents Windows ZIP separators extracting incorrectly on Linux. **Fix:** verify resulting ZIP entry paths, clean-extract on Linux and Windows, `npm ci`, Playwright install, smoke test and checksum; compare exact uploaded artifact SHA-256. **Acceptance:** the *uploaded* archive—not merely an intermediate folder—reproduces in both environments; no identifying metadata leaks.

### Group F — Scientific validity and value proposition

#### SS-RES-01 | P1 research | Controlled benchmark base is narrow and researcher-designed

**Evidence (RECORDED):** Phase 18 uses 16 labeled pairs, and [`THREATS_TO_VALIDITY.md`](https://github.com/SanamRai001/StateScout/blob/main/docs/THREATS_TO_VALIDITY.md) acknowledges benchmark alignment risk. **Fix:** keep frozen data unchanged and design **new** independently labeled test applications, predefine hypotheses and evaluate inter-rater disagreement where feasible. **Acceptance:** independent benchmarks report FM/FS and practical discovery impact, including failures.

#### SS-RES-02 | P1 research | Real-world sample and state oracle are insufficient for broad claims

**Evidence (RECORDED):** Phase 19 requested 15 runs on five public targets; nine succeeded, six were unavailable and only three targets were evaluable. Original result had one graph-stable target; repeated data changed later. **Fix:** add authorized staging apps spanning SPA, auth, rich forms, async lists, localization and accessibility variations. Manually label bounded reachable workflows; distinguish absolute coverage from stability. **Acceptance:** explicit denominators, environment metadata, failure classifications, and no broad claims without an oracle.

#### SS-RES-03 | P2 research | No fair head-to-head modern method comparison

**Evidence (RECORDED):** the novelty matrix explicitly disclaims SOTA comparison to Judge, FragGen and WebEmbed; APE already rebuilds models under abstraction changes. **Fix:** measure clearly defined common tasks and cost budgets against URL-only, strict semantics, and at least one reproducible external comparator where feasible. Keep paper claims centered on cross-run rule trust, not “invented state graphs”. **Acceptance:** tables distinguish implementation differences, unavailable tools, baselines and reproducibility limitations.

#### SS-IDEA-01 | P1 strategy | Research novelty is not identical to developer demand

**Evidence (PRODUCT RISK):** the ability to revise semantic equivalence is technically interesting but not itself the first thing QA developers buy or adopt. **Fix:** focus initial user story on *“What workflow changed, where, and why should I trust this evidence?”* Validate with developer tasks and repeat usage; treat trust lifecycle as an enabling differentiator. **Acceptance:** independent developers can explain a seeded change with StateScout faster or more reliably than a defined baseline.

#### SS-IDEA-02 | P2 strategy | Feature expansion can bury the core value

**Evidence (PRODUCT ROADMAP RISK):** long-term goals mention test generation, AI fallback, screenshots, broad form understanding and reports. **Fix:** explicitly defer SaaS accounts, billing, collaboration, multi-agent orchestration, arbitrary production crawling, autonomous destructive actions and a graph editor. **Acceptance:** MVP has one install/crawl/report/compare workflow, no mandatory AI or cloud dependency, and documented non-goals.

## 4. Target architecture and data contracts

### Recommended flow

```text
Authorized local/staging target + explicit policy
                |
                v
CLI / product orchestrator  -- run manifest & safety preflight
                |
                v
Browser context policy <----> Playwright adapter
  | allowlists/approvals       | observe, resolve unique target,
  | request/navigation guard   | act, settle, verify boundary
                |             |
                +------v------+
                       |
           Append-only attempt/evidence log
                       |
          Redaction and safe artifact writer
                       |
                 Raw observations
                       |
       Identity projection + trust-profile version
                       |
          Canonical graph + provenance links
                       |
         Baseline comparison + uncertainty
                       |
                Offline HTML report
```

**MVP artifact contract (proposal):** `run.json` (manifest/completion), `events.jsonl` (attempts/outcomes), `states.json` (redacted observations/projections), `graph.json`, `policy-decisions.json`, `errors.json`, and `report/index.html`. Optional screenshots are separately gated and sanitized. `checkpoint.json` is a private resume aid, not a public report by default.

**Mandatory invariants:**

1. No action executes without a recorded safety decision; ambiguous action = blocked unless explicitly approved.
2. No persisted field bypasses the redaction policy; sensitive-data handling is versioned.
3. Browser-level origin policy is checked before and after interactions; every exception is deliberate.
4. Every executed action resolves to one verified target or fails safely as ambiguous.
5. Every run freezes its fingerprinter/profile/policy; it cannot silently change halfway through.
6. Raw attempt/evidence events are append-only; graph projection may be regenerated without rewriting raw history.
7. A report labels partial/failed/blocked/unreplayable evidence distinctly; comparison never upgrades uncertainty into certainty.
8. An interrupted write cannot replace the last known-valid checkpoint with an invalid file.
9. The research freeze stays immutable unless a documented defect exception creates a new scientifically auditable baseline.

## 5. UX specification for the first useful product

**Primary persona:** developer or QA engineer debugging an authorized app in a local/staging environment. **Primary job:** “Discover a workflow and understand why it differs from yesterday.” **MVP steps:** install → run a safe preflight → explore → inspect report → compare a second run.

**CLI examples (proposed future interface; not assertions about current main):**

```powershell
statescout crawl http://localhost:3000 --config .\statescout.config.json
statescout report .\statescout-runs\run-001
statescout compare .\statescout-runs\baseline .\statescout-runs\candidate
```

**Offline report information architecture:**

- **Overview:** target/environment, versioned policy/identity, discovered states, executed/blocked/ambiguous actions, run completeness, evidence sensitivity.
- **Findings:** changed/added/removed/uncertain states and transitions, ranked by reproducibility and impact, not unsupported severity scores.
- **State explorer:** accessible searchable list with route/heading/landmark summary, filters and selected controls.
- **Workflow path:** breadcrumb of actions and verified intermediate states; replay evidence and exact failure cause.
- **Evidence drawer:** semantic differences, timing, redacted screenshots/trace links if enabled, source event IDs.
- **Policy & health:** blocked actions with reasons, probe coverage, async instability, incomplete artifacts and revalidation status.

**UX guardrails:** WCAG 2.2 AA as a design target for generated HTML; responsive report, keyboard-first tables, visible focus, no reliance on graph color alone, copyable diagnostic IDs, reduced-motion defaults, and printable/exportable text summary. A graph can be an optional navigation aid, never the sole route to facts. A security warning should be visible before crawling any non-local target.

**User acceptance scenarios:** (a) inspect why “Open filters” was explored but “Delete order” was blocked; (b) locate one newly appeared dialog; (c) identify a wrong-locator ambiguity without accidentally clicking either item; (d) understand why a failed replay does **not** prove a regression; (e) use the report without a mouse.

## 6. Phased implementation plan (dependency-ordered)

**Important:** phases are milestones, not promises of completion time. Work in small PRs and update `docs/PROJECT_STATE.md` only at accepted milestones. Use the exact current branch/Git state at implementation time; the SHA references above are an audit baseline, not permission to reset anyone’s work. No merge, push, deletion, production crawl or deployment without explicit approval.

### Phase R0 — Protect the paper and artifact track

**Goal:** preserve submission integrity without altering the frozen experiments. **Dependencies:** none. **Source issues:** SS-QA-05, SS-QA-03, research-freeze governance.

**Tasks:** verify PR #26 portability fix against current `main` without blindly merging divergent paper changes; generate the archive from a clean checkout; inspect ZIP paths on Windows and Linux; extract fresh; run `npm ci`, Chromium install, `artifact:smoke`, digest/identity preflight; compare the *uploaded* artifact hash; verify anonymous manuscript and license; record provenance. Check the repository's reported November 2, 2026 AoE deadline against current venue information separately.

**Deliverables:** artifact verification record with commit/ZIP hash; clean-extraction logs; updated submission checklist; explicit provenance decision. **Gate:** no path-separator defects; smoke and integrity checks pass on both OSes; research trees match freeze. **Out of scope:** changing algorithms or product UI.

### Phase P0 — Enforce browser safety and privacy

**Goal:** make the runner safe enough for authorized disposable staging trials. **Dependencies:** R0 isolation decision. **Issues:** SS-SEC-01/02/03/05/06.

**Tasks:** threat model requests/navigation/popups, establish conservative action allowlist, implement browser policy hooks and postcondition checks, add redact-before-persist types, define artifact retention/allowlist, bound artifact deletion, add adversarial fixtures. Audit any use of Playwright storage state, URLs, errors or screenshots. Reserve a freeze-exception process if a change must touch protected files.

**Deliverables:** safety policy specification, privacy policy, adversarial tests, local-run warning, product-specific branch. **Gate:** zero forbidden side effects in adversarial controlled suite; forbidden top-level origin escapes blocked; sentinel secrets absent from **all** output artifacts; unsafe artifact paths rejected. **Rollback:** disable external targets and return to fixture-only mode if boundary enforcement is uncertain.

### Phase P1 — Correct observation, identity and locator semantics

**Goal:** avoid wrong actions and misleading state identity before building reports. **Dependencies:** P0. **Issues:** SS-SEC-04, SS-ID-01/02/03/04/05/06.

**Tasks:** scoped target identity with unique-locator resolution; explicit identity/profile configuration; stable-state observation contract; selected meaningful content; order-sensitive fixtures; define supported action kinds. Preserve research v1-v4 for reproduction; introduce any corrected product observer as an explicitly new version. Record confusion-matrix FM/FS and failed/ambiguous transition counts.

**Deliverables:** versioned observer and action contracts, independent fixtures, fingerprint compatibility tests. **Gate:** duplicate-label fixtures choose the right target or safely fail; frozen scientific metrics remain reproducible; product regressions demonstrate content distinctions and controlled noise handling; every run reports the actual identity version.

### Phase P2 — Integrate and harden the local CLI

**Goal:** deliver a usable, predictable crawl command on a new product branch. **Dependencies:** P0–P1. **Issues:** SS-UX-01/05, SS-QA-01/02.

**Tasks:** carefully extract reviewed CLI work from `feat/statescout-cli-v1`; reconcile diverged commits and avoid paper/anonymous changes unrelated to CLI; add lockfile; validate URL/target authority and output paths; add meaningful progress/status/error codes; write a run manifest and schema validation; document Windows/Linux install and fixture quick start; add full CLI browser smoke in CI.

**Deliverables:** `crawl`, `--help`, machine-readable output, safe artifact bundle, CI workflow and command reference. **Gate:** clean installation and bounded local-fixture crawl on Windows and Linux; commands fail gracefully on malformed input, timeout or blocked action; no unredacted outputs; CI tests more than CLI help.

### Phase P3 — Evidence quality and offline HTML reporting

**Goal:** let a developer understand the crawl without reading raw JSON. **Dependencies:** P2. **Issues:** SS-ARC-03/05/06, SS-UX-02/04.

**Tasks:** append-only attempt events separate from graph edges; provenance references; explicit incomplete-evidence handling; safe HTML report generator with accessible tables, findings, workflow path and policy explanations; optional screenshot/trace only after sanitization review; basic report UX tests.

**Deliverables:** typed evidence schema, `report` command, standalone HTML, sample reports and accessibility checks. **Gate:** a seeded “blocked”, “ambiguous”, “failed” and “observed” outcome are distinguishable; users can answer “what happened and why?” without JSON; keyboard-only inspection works; report never presents partial data as complete.

### Phase P4 — Baseline comparison and regression explanation

**Goal:** transform isolated graphs into actionable QA information. **Dependencies:** P3 and compatible manifests. **Issues:** SS-UX-03, SS-ARC-06, SS-IDEA-01.

**Tasks:** implement compatibility preflight; deterministic matching of states/transitions with provenance; classify added/removed/changed/unknown; record sampling differences, policy changes, observer changes and replay failures; add reports with linkable evidence and regression summaries. **Deliverables:** `compare` command, diff JSON/HTML, controlled change corpus.

**Gate:** seeded dialog/validation/state transition changes detected; equivalent noisy reruns do not yield unsupported defect claims; mismatched observer or trust versions cause a clear incompatible/uncertain result rather than a false regression.

### Phase P5 — Orchestrate cross-run rule trust and reversible evidence

**Goal:** make the distinctive research mechanism usable without contaminating active runs. **Dependencies:** P3–P4. **Issues:** SS-ARC-01/06, SS-ID-04.

**Tasks:** orchestrate candidate collection/quarantine; offline promotion and revalidation; require provenance and application scope; materialize validated active profiles; preserve raw observations; reproject after challenge/revocation; expose trust history and confidence limitations in the report. Keep a run’s active identity immutable.

**Deliverables:** lifecycle application service, profile compatibility manifest, two-run test and trust timeline UI. **Gate:** changed behavior challenges/revokes prior trust; raw digest remains unchanged; future run projects a corrected graph; older run remains reproducible and no historical missing descendants are falsely “recovered”.

### Phase P6 — Reliable resume and measured performance

**Goal:** improve robustness on realistic longer workflows without speculative infrastructure. **Dependencies:** P2–P5. **Issues:** SS-ARC-02/04/05.

**Tasks:** add atomic persisted checkpoints and previous-good fallback; inject process interruption; log replay costs, action timing and checkpoint cost; benchmark restoration alternatives against root replay; cap state/transition/memory budgets; keep safe cancellation. Consider SQLite **only if** filesystem evidence shows a concrete query or consistency problem.

**Deliverables:** recovery runbook, performance traces, bounded resource defaults, benchmark report. **Gate:** crash simulation recovers without duplicate untracked side effects; graph outcomes remain compatible with baseline; measured replay cost improves or is transparently documented; resource budget exhaustion is reported as partial, not success.

### Phase V1 — Independent product and scientific validation

**Goal:** decide whether StateScout actually provides useful workflow insight. **Dependencies:** P4 minimum; P5/P6 for full evaluation. **Issues:** SS-RES-01/02/03, SS-IDEA-01/02.

**Tasks:** recruit independent fixture/app owners or peers; pre-register application classes, comparison baseline and metrics; pilot on authorized SPA, auth, async forms and accessibility scenarios; include human task-success tests; report both wins and failures; compare to basic Playwright trace/manual inspection, URL-only and one reproducible established comparator where feasible.

**Deliverables:** public evaluation protocol, raw anonymized results, usability findings, product go/no-go decision and separately versioned research follow-up. **Gate:** repeated demonstration of useful change explanation at acceptable false-alert, safety and runtime cost; transparent unknowns; an independent user can run it without the author.

### Dependency map

`R0 (research artifact isolation) → P0 (safety/privacy) → P1 (correctness) → P2 (CLI) → P3 (report/evidence) → P4 (compare) → P5 (trust lifecycle) → P6 (reliability) → V1 (validation)`.

Independent literature review and evaluation protocol drafting can occur in parallel, but **must not** block P0 or introduce uncontrolled changes to the frozen paper. If the paper deadline is imminent, prioritize R0 before product changes.

## 7. Test matrix and objective release gates

| Test class | Controlled failure scenario | Required observable behavior |
| --- | --- | --- |
| Safety action | “Continue” triggers POST | Request prevented or action never executed; reason logged |
| Navigation | JS button redirects to other origin | No unauthorized explored state; policy event recorded |
| Popup | `window.open()` to external host | Popup rejected or isolated; no exploration leak |
| Redaction | Password/token/query sentinel | Sentinel absent from artifact bytes and report |
| Locator | Two table rows with “Details” | Unique intended row or `AMBIGUOUS_TARGET` |
| Async readiness | Loading → stable content | Stable intended state or explicit unsettled timeout |
| Identity | Distinct status/list text, same controls | Meaningful states remain distinct on product observer |
| Noise | Timestamp/ad/ID on same state | No unacceptable FS under selected policy |
| Compatibility | Compare v1 vs modified v4/profile | Reject incompatible or label uncertain |
| Evidence | Same transition retried twice | Two attempts, one canonical graph edge |
| Crash | Partial checkpoint write | Previous-good checkpoint recovered; no false success |
| UX accessibility | Keyboard-only report navigation | All core findings accessible without graph interaction |
| Portability | Fresh ZIP extract on Linux/Windows | Correct paths; installed smoke verifies exact archive |

**No-go conditions:** any demonstrated unapproved mutation, secret leak, uncontrolled origin escape, wrong-target click, unbounded destructive output path, or report that presents incompatible/partial evidence as definite regression. Restrict to fixtures until corrected.

**Definition of Done per PR:** issue ID; scope and non-goals; before/after observable behavior; static + focused test evidence; cross-module callers/consumers checked; PowerShell commands and expected output; failures or unrun checks labeled; docs updated at milestone only; no unauthorized commit, merge, push, branch deletion, deployment or live-data access.

## 8. Implementation discipline and safe Git strategy

Before any edit, inspect `git status --short`, current branch, worktrees, HEAD and unresolved local changes. Never assume the connected GitHub branch matches the developer’s local copy. Product fixes should be scoped to a new product branch from current `origin/main` after checking divergence. Preserve the CLI branch; extract relevant hunks or cherry-pick reviewed commits only when their impact is understood. Treat `paper/*` and frozen research files as separate change domains.

**Suggested issue/PR batches:** P0a action + origin guards; P0b privacy/redaction; P0c packaging safe path; P1a target uniqueness; P1b observer/identity; P2a CLI extraction; P2b CI/install; P3a event/evidence schemas; P3b HTML report; P4 compare; P5 lifecycle; P6 recovery; V1 evaluation. Each batch should remain independently testable and reversible.

**Safe local inspection commands (read-only):**

```powershell
cd D:\Projects\StateScout
git status --short
git branch --show-current
git rev-parse --short HEAD
git worktree list
git log -1 --oneline
```

**Historical frozen verification commands (run on clean, correctly installed research checkout):**

```powershell
npm run typecheck
npm test
npm run experiment:phase21
```

**Future product gate (illustrative; define scripts during P2):**

```powershell
npm ci
npx playwright install chromium
npm run verify:product
```

Do not treat the last example as a currently available command. For an artifact ZIP, run only documented artifact-specific commands from a freshly extracted archive and verify its manifest and paths first.

## 9. Risk register and decisions to revisit

- **Overblocking:** strict safety policy may miss useful workflows. Accept this for MVP; report it explicitly; widen permitted actions only after controlled evidence and approval.
- **Observer inflation:** adding visible content can create excessive false splits. Add targeted content incrementally with counterexamples and confusion-matrix reporting.
- **Trust drift:** stale learned abstraction may suppress meaningful states. Require scope/provenance/freshness and explicitly surface challenged trust in the report.
- **Invalid comparisons:** browser/policy/profile differences can masquerade as regressions. Require compatibility checks and mark uncertainty.
- **Paper contamination:** changing frozen algorithms without reseeding the scientific baseline undermines reported results. Keep separate branches and provenance.
- **Package deletion:** artifact-generation output should never carry unbounded recursive delete authority.
- **Feature creep:** no SaaS, billing, teams or default AI planning before product value is demonstrated.
- **Data handling:** local reports and ZIP exports may be shared accidentally. Default to redaction, safe output paths and clear sensitivity warnings.

**Decisions deferred pending evidence:** (1) whether product identity defaults to improved v4 or a new observer version; (2) whether a database is necessary; (3) when to support safe form filling; (4) whether screenshots/traces can be sanitized reliably; (5) whether AI adds measurable value beyond deterministic prioritization; (6) whether independent users find comparison valuable enough to justify UI investment.

## 10. Verification and open unknowns

**Source-verified in audit:** repository structure; core/browser code paths; keyword risk classifier; `.first()` locator execution; default v1 identity; in-snapshot input values; JSON CLI outputs on separate branch; unchecked output deletion; lack of a product UI on `main`; status of open PR #26; large historical branch count; existing script/CI definitions.

**Recorded rather than independently rerun here:** frozen 75/75 tests, Phase 18 16-pair results, Phase 19 repeated-run outcomes, Phase 20 deep-replay counts, prior artifact smoke tests and CLI smoke success. **Unverified:** real exploit reproduction, correct end-to-end HTTP interception architecture, actual credential leak in a real app, a running UI visual audit, cross-platform uploaded ZIP reproduction today, performance improvement from proposed caching, user study outcomes, fresh installation and current venue deadline.

**Recommended first milestone:** close R0 for the existing paper artifact, then begin P0 with adversarial fixtures and fail-closed policies. Do **not** start by building a polished dashboard. The product has to prove safety, correctness and developer utility before visual sophistication.

## 11. Evidence index (pinned to inspected repository paths)

- [Main repository](https://github.com/SanamRai001/StateScout/tree/89003cdbcd560fad0186900d6058c3b99b7089ec)
- [Research freeze rules](https://github.com/SanamRai001/StateScout/blob/main/docs/RESEARCH_FREEZE.md)
- [Core policy](https://github.com/SanamRai001/StateScout/blob/main/src/core/policy.ts)
- [Playwright adapter](https://github.com/SanamRai001/StateScout/blob/main/src/browser/playwrightAdapter.ts)
- [Explorer](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorer.ts)
- [Fingerprint v4](https://github.com/SanamRai001/StateScout/blob/main/src/core/fingerprintV4.ts)
- [Graph model](https://github.com/SanamRai001/StateScout/blob/main/src/core/graph.ts)
- [Checkpoint serialization](https://github.com/SanamRai001/StateScout/blob/main/src/browser/explorationCheckpoint.ts)
- [Results summary](https://github.com/SanamRai001/StateScout/blob/main/docs/RESULTS_SUMMARY.md)
- [Threats to validity](https://github.com/SanamRai001/StateScout/blob/main/docs/THREATS_TO_VALIDITY.md)
- [Novelty positioning](https://github.com/SanamRai001/StateScout/blob/main/docs/NOVELTY_POSITIONING.md)
- [CLI development branch](https://github.com/SanamRai001/StateScout/tree/feat/statescout-cli-v1)
- [Open portable ZIP PR #26](https://github.com/SanamRai001/StateScout/pull/26)
- [Anonymous artifact builder](https://github.com/SanamRai001/StateScout/blob/main/paper/analysis/build-anonymous-artifact.ts)

## 12. Reuse-first implementation strategy — build on mature projects

**Status:** product architecture proposal, not an implementation or a proven integration. **Checked:** 29 October 2026 against available official documentation and repository/package metadata. Pin a tested version and recheck license/dependency terms before shipping. The audit's original findings and R0→V1 phase order remain authoritative.

### 12.1 What StateScout should own, and what it should reuse

The intellectual and product differentiators are **semantic observation/identity**, **evidence-backed and revocable cross-run abstraction trust**, **safe exploration decisions**, **run compatibility**, and **explaining meaningful workflow regressions**. Those need StateScout-owned contracts and tests. Commodity browser automation, trace playback, test-runner infrastructure, accessibility linting and graph rendering should not be rebuilt just to look proprietary.

Adoption options are deliberately different:

- **ADOPT** — use the existing library/API in the product rather than implementing an equivalent.
- **INTEGRATE CONDITIONALLY** — run a small compatibility/privacy/licensing PoC, then adopt only if its measured value exceeds added complexity.
- **STUDY / BASELINE** — use an external project as comparison and design inspiration; do not copy its architecture blindly or make it a runtime dependency.
- **DEFER** — do not add complexity until a real user scenario requires it.

### 12.2 Reuse matrix and license decisions

| Project / existing capability | Recommendation and phase | What we reuse instead of rebuilding | Boundaries, costs and license |
| --- | --- | --- | --- |
| **[Microsoft Playwright](https://playwright.dev/)** (`playwright`; existing dependency) | **ADOPT**, P0–P6 | Browser contexts, routed requests, popups/navigation events, locator strictness/actionability, storage-state APIs where authorized, tracing and browser instrumentation. | Apache-2.0. Browser context interception is **not a complete network sandbox**; service workers, WebSockets and misbehaving GET endpoints require separate policy/threat-model tests. Keep the current research adapter untouched. |
| **[Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)** | **ADOPT selectively**, P3/P6 | Capture and replay of troubleshooting traces via `browserContext.tracing`; inspect with `npx playwright show-trace ...` instead of writing a trace timeline UI. | Part of Playwright (Apache-2.0). DOM snapshots, screenshots and network metadata can reveal secrets. **Opt-in or failure-only on disposable fixtures** until redaction and sharing controls are verified. Never silently upload traces. |
| **[Playwright Test runner and HTML reporter](https://playwright.dev/docs/test-reporters)** | **INTEGRATE CONDITIONALLY**, P1/P2/P3 | Product E2E fixtures, browser assertions, retries, HTML test report, fixtures and trace-on-retry. | Apache-2.0. Existing frozen research tests use `node:test`; **do not migrate or modify them**. Add isolated product-spec tests only if they simplify integration. Playwright's HTML test report is **not** StateScout's workflow-difference report. |
| **[Playwright Test Agents](https://playwright.dev/docs/test-agents)** (planner/generator/healer) | **STUDY / optional developer helper**, P1/P4/V1 | Generate initial test plans and example Playwright tests for controlled fixtures; use `npx playwright init-agents --loop=opencode` if the installed Playwright version supports it. | Playwright tooling; LLM providers may incur cost and nondeterminism. They are not a safe-action authorization system, not a substitute for ground truth, and should not be product runtime dependencies. Inspect generated tests before use. |
| **[Crawljax](https://github.com/crawljax/crawljax)** | **STUDY / BASELINE**, V1 | Established event-driven web crawling and dynamic state-flow graphs as a meaningful comparison; inspect exploration strategies and graph outputs. | Apache-2.0; Java/Maven rather than Node/TypeScript. Do **not** embed or port the crawler into StateScout just to claim reuse. Execute separately on the same fixture with bounded budgets and comparable policies; document apples-to-oranges differences. |
| **[BrowserGym](https://github.com/ServiceNow/BrowserGym)** | **DEFER / independent research evaluation**, V1 or later | Existing web-agent tasks and benchmark harness ideas to challenge external validity. | Apache-2.0 project license; Python and heavier benchmark setup; individual benchmark/data licenses and access constraints may vary. It is a research environment **not a consumer product or a plug-in replacement for the current explorer**. |
| **[Cytoscape.js](https://js.cytoscape.org/)** | **INTEGRATE CONDITIONALLY**, P3 | Optional interactive graph visualization and layouts instead of writing a canvas renderer/graph layout engine. | Core and first-party extensions MIT; check selected third-party extensions individually. First deliver an accessible, searchable **table/list**. Use graph only if it improves a real investigation task; benchmark 200–1,000 nodes and preserve a non-visual fallback. |
| **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** | **INTEGRATE CONDITIONALLY**, P3/V1 | Automated accessibility checks for the generated HTML report and controlled target fixtures. | **MPL-2.0**, not MIT. Preserve notices and comply with file-level license requirements if modifying/distributing licensed files. An automated scan cannot certify complete WCAG 2.2 compliance; add keyboard/screen-reader manual checks. |
| **GitHub Actions (existing)** | **ADOPT / EXTEND**, P2/V1 | CI execution and downloadable run artifacts rather than inventing a hosted job queue or custom CI runner. | GitHub-hosted service; permissions, retention, cost/limits and trace sensitivity must be configured. Run product jobs separately from paper-only CI and never make CI collect real credentials. |

**Do not confuse reuse with copying code.** Link the upstream project, declare the exact package/version in the lockfile, keep a `THIRD_PARTY_NOTICES` record if distribution warrants it, review transitive licenses with a dependency scanner, and check advisories. Crawljax and BrowserGym are primarily **comparison/benchmark tools**, not expected imports into the TypeScript production runtime.

### 12.3 Phase-by-phase reuse implementation playbook

#### R0 — Research-artifact integrity (reuse what already exists)
1. Preserve the existing research freeze validator, anonymous artifact packaging scripts, and GitHub Actions paper workflow; do not replace them with a new build system.
2. Resolve the separate portable ZIP proposal after verifying the exact archive on clean Windows and Linux extraction, including `npm ci` and documented smoke tests.
3. Record SHA-256 and version of the actual reviewer ZIP. Keep artifact URLs and paper metadata double-anonymous.
4. **Gate:** precise archive hash, path portability, freeze identity and anonymity checks pass independently. Product dependencies and product UI stay out of the frozen artifact.

#### P0 — Safe browser execution, privacy and filesystem guards (Playwright)
1. Implement a **product-only browser policy adapter** around Playwright `BrowserContext`/`Page` with explicit capabilities: allowed origins, popup behavior, request-method allowlist, downloads, timeout and resource limits.
2. Validate event coverage using controlled `window.location`, redirects, `window.open`, fetch POST, WebSocket/service worker, form submission and deliberately mutating GET fixtures. Playwright callbacks are a **defense-in-depth layer, not a proof that execution is sandboxed**; use disposable test environments and deny/approval defaults.
3. Reuse Playwright's locator actions/strictness and built-in actionability instead of writing click/wait logic. Do not accept `.first()` as a correctness fallback for repeated targets.
4. Redact snapshot, input, URL, trace, exception and screenshot evidence **before persistence**. Defer rich tracing until this privacy gate passes.
5. Reuse Node filesystem/path primitives but enforce a generated-artifact root and sentinel marker before recursive replacement. Do not introduce a custom generic filesystem framework.
6. **Gate:** all SS-SEC adversarial tests pass, including a test where “Continue” triggers a mutation, cross-origin redirect and secret sentinel, with no unapproved side effect/output leak.

#### P1 — Semantic identity and reliable interaction (Playwright primitives, StateScout core)
1. Continue to own the StateScout observer and v4/product identity strategy; Playwright cannot define your semantic equivalence policy.
2. Use role/name and container-scoped Playwright locators (`getByRole`, `filter`, scoped `locator`) with `count()` and ambiguity outcomes. Reuse locator built-in waiting rather than implementing custom retry loops.
3. Augment observation selectively with task-relevant status/list content, using measured false-merge and false-split fixtures. Use Playwright test fixtures for DOM variation and rerender cases.
4. Keep identity strategy, observer schema, application scope and trust-profile digest in every run manifest.
5. **Gate:** different table rows are never conflated, ambiguous controls do not execute, unstable asynchronous observations receive explicit states/errors, and baseline confusion-matrix metrics are recorded.

#### P2 — Local CLI and CI (reuse branch work and existing tooling)
1. **Salvage** `feat/statescout-cli-v1/cli/statescout.ts` and `docs/CLI_USAGE.md` by selective review/port, **not a blind branch merge**. Preserve the user's uncommitted local state; GitHub commits do not prove the local worktree is clean.
2. Keep the small built-in CLI parser until flags/validation complexity justifies a framework. Avoid adding Commander/Yargs only for branding.
3. Use `npm ci`, the checked-in lockfile, existing Playwright install procedures and GitHub Actions. Define a product smoke gate that launches a safe controlled page, crawls, writes the manifest, checks redaction, parses the result and exits predictably.
4. Separate paper and product jobs; never modify the freeze/benchmark/test trees in a supposedly documentation-only PR.
5. **Gate:** Windows and Linux clean-checkout smoke tests pass, the command reports its real identity version/policy, and no false “complete” result occurs when the budget was exhausted.

#### P3 — Offline report and debugging evidence (Trace Viewer + optional Cytoscape.js + axe)
1. Implement the minimum *StateScout-specific* report surface: finding summary, searchable state table, action outcomes, policy reasons, replay divergences, uncertainty badges, and evidence links. This explanatory domain layer does **not** exist in generic Playwright reports.
2. For targeted failure forensics, offer a local **Trace Viewer link/command** to a safely captured trace instead of building a proprietary action timeline. Add failure-only capture before full-run traces; trace policy must explain security limits.
3. Only after a usability test, add Cytoscape.js to render optional filtered graphs. Do not write graph layout algorithms from scratch.
4. Use `@axe-core/playwright` on the static report when licensing/size checks pass; complement with keyboard navigation, contrast and screen-reader testing. Prioritize HTML semantics over canvas-only UX.
5. **Gate:** a developer who has not seen StateScout can identify which action changed a state and why one attempt failed without reading JSON; sensitive fixtures do not leak to HTML, trace or graph metadata.

#### P4 — Compatible baseline comparison (reuse browser assertions, not domain analysis)
1. Reuse Playwright browser fixtures and screenshots to reproduce candidate changes, and optionally its test reporters for regression **test execution**.
2. **Build** StateScout's domain-specific graph comparison: compatibility check, stable state/edge mapping, rule-profile drift, missing evidence, uncertainty labels and human explanation. Playwright visual snapshots and HTML reports do **not** replace this algorithm.
3. Build fixtures for deleted dialog, renamed control, altered list value, timing noise, policy change and changed fingerprinter; compare across clean baselines.
4. Optionally use Playwright Test Agents to *suggest* missing scenarios, then manually review and freeze ground truth before benchmarking.
5. **Gate:** real changes are detected; known environmental noise and incompatible runs are not falsely reported as definite regressions.

#### P5 — Cross-run trust lifecycle (keep StateScout's novel code)
1. Keep the existing candidate quarantine, offline promotion, trust lifecycle, selective revalidation and reversible archive implementations.
2. **Build only the glue:** a run coordinator, validated active-profile materializer, evidence-to-rule provenance mapping, cross-run compatibility and explanations.
3. Do not import an AI state classifier or Crawljax comparator to replace this evidence lifecycle without an ablation that directly supports that decision.
4. **Gate:** trust challenge/revocation changes a future projection while old raw artifacts and prior run identity remain immutable; no promise to recover interactions never observed.

#### P6 — Resume and runtime performance (Playwright state APIs + measured alternatives)
1. Instrument root-replay and checkpoint serialization costs before changing algorithms. Reuse Playwright storage state only when safe/test-fixture-specific, encrypted or ephemeral as required, and explicitly opted in.
2. Compare full replay, application reset hooks, verified checkpoints, and safe storage-state restoration under equal scenarios. Cookies/local storage alone **do not** recreate arbitrary JavaScript in-memory UI state.
3. Keep JSON + atomic filesystem writes initially. Consider SQLite for query/resume consistency only after a measured need; do not add a database by reflex.
4. **Gate:** deterministic interrupted/resumed tests agree, crashes cannot silently corrupt reported success, and any claimed performance improvement is repeatable on more than one fixture.

#### V1 — Fair independent evaluation (Crawljax, BrowserGym where appropriate)
1. Benchmark the minimum StateScout product against manual Playwright/Trace Viewer workflow and URL-only identity on authorized applications.
2. Include Crawljax **as a separately run state-graph crawler baseline** where Java setup and target permissions allow. Control for the same app snapshots, time/action budget, safety exclusions and evaluation oracle; report differences that cannot be normalized.
3. Use BrowserGym only if it improves the scientific comparison without changing the product problem or requiring disproportionate Python/benchmark infrastructure.
4. Measure **meaningful state coverage, wrong-target rate, unsafe side-effects prevented, reproducibility, false merge/split, explainability, developer task completion and runtime cost**; do not score only graph-node count.
5. Compare a minimal no-graph HTML report to the Cytoscape graph version using the same developer tasks. Keep the graph only if it measurably helps.
6. **Gate:** at least one independent developer can install and use the local CLI, correctly interpret its incomplete/uncertain evidence, and identify a real workflow change without author coaching. Publish failures and limitations.

### 12.4 Reuse proof-of-concept / adoption decision template

For every new dependency or externally run baseline, create a small `ADR` note within the owning phase PR (not another project-status file) answering:

1. **Problem:** Which exact StateScout requirement does this solve? What is the simplest existing solution?
2. **Adoption mode:** ADOPT, INTEGRATE CONDITIONALLY, STUDY/BASELINE or DEFER.
3. **Integration seam:** Exact function/package interface, caller, output/evidence schema, runtime boundary and how failures propagate.
4. **Safety:** Does it execute actions, read credentials, capture traces, persist data, access the network, or follow redirects? Does it have a fail-closed setting?
5. **Legal:** Exact package and version, SPDX license, required notices, transitive dependencies, and whether the license conditions are compatible with StateScout's MIT distribution.
6. **Maintenance:** Recent releases, security advisories, Node/Windows/Linux compatibility, lockfile pinning, ability to replace it later.
7. **Evaluation:** Minimum fixture, expected output, reliability, performance and one explicit **rejection threshold**.
8. **Decision:** Adopt, fork only if justified, use as external baseline, or decline—explain why.

Do not add a new runtime dependency just because it is popular. Every adoption must reduce **total ownership cost** (engineering + testing + security + maintenance) relative to a small supported native alternative.

### 12.5 Priority shortlist — what to do first, without installing anything yet

| Sequence | Decision to test | Smallest acceptable experiment | Continue only if |
| --- | --- | --- | --- |
| 1 | Playwright browser-context policy primitives | One synthetic app with redirect, popup and POST controls | Unapproved effects are blocked or action is denied with diagnostics |
| 2 | Playwright locator uniqueness/scoping | Two identical “Details” controls in different rows | Correct target resolved or explicit `AMBIGUOUS_TARGET` |
| 3 | Existing CLI branch extraction | Clean checkout with one safe fixture, ten-action budget, parsed outputs | End-to-end smoke passes on Windows and Linux |
| 4 | Trace Viewer for failures | Capture one synthetic divergence in a non-sensitive fixture | The developer can explain it without a custom timeline |
| 5 | Plain HTML report vs graph | Five common debugging tasks with and without optional Cytoscape | Graph earns its complexity; accessible table stays usable |
| 6 | Crawljax as comparison baseline | Same controlled demo app, fixed budgets | Comparison is reproducible and fair enough to learn from |
| 7 | Playwright Test Agents | Generate fixture tests with OpenCode; review outputs manually | Useful coverage gained without unverifiable assertions or material cost |

**Explicit rejection decisions:** no new full-stack web server for report viewing; no React app just to display the first report; no cloud account/credential storage; no proprietary agent planning in the core; no blind integration of Crawljax Java internals; no BrowserGym required for the CLI; no large UI framework before a static accessible report is useful.

### 12.6 Upstream reading list and license verification sources

- Playwright: [browser tracing and Trace Viewer](https://playwright.dev/docs/trace-viewer), [tracing API](https://playwright.dev/docs/api/class-tracing), [Test Agents / OpenCode workflow](https://playwright.dev/docs/test-agents), [source/package license](https://github.com/microsoft/playwright/blob/main/packages/playwright/package.json).
- Crawljax: [repository and documentation](https://github.com/crawljax/crawljax) (Apache-2.0, Java/Maven).
- Cytoscape.js: [official API/site](https://js.cytoscape.org/) (MIT core and first-party extensions).
- BrowserGym: [project](https://github.com/ServiceNow/BrowserGym), [Apache-2.0 license](https://github.com/ServiceNow/BrowserGym/blob/main/LICENSE).
- axe-core Playwright integration: [usage](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md), [package/license metadata](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/package.json) (MPL-2.0).

The above are **source references**, not assertions that all versions and transitive dependencies were independently installed and tested as part of this documentation task.

---

**Document ownership:** proposed engineering/research roadmap, not a second project-state file. When adopted, link it from `README.md` and keep current operational progress solely in `docs/PROJECT_STATE.md`. Findings should change status only after tests and concrete evidence, not because implementation is merely planned.
