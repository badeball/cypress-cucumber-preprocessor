# Cypress reproduction — `afterSpecHandler: has-reloaded`

A minimal, self-contained Cypress project that reproduces:

```
An error was thrown in your plugins file while executing the handler for the
after:spec event.
Error: Unexpected state in afterSpecHandler: has-reloaded
```

## Why this works

On Cypress `<15.18.0`, reload-behavior re-fires `before:spec`. A **GPU-process
crash** makes Cypress recover by re-firing `before:spec` (state → `has-reloaded`)
without re-running the spec, so `after:spec` fires while still in `has-reloaded`
and `afterSpecHandler` throws.

It must be a **GPU-process** crash, not a renderer crash: `afterSpecHandler`
already catches renderer crashes (`We detected that the … process just crashed`)
via `browserCrashExprCol` and skips the report. A GPU crash isn't matched, so it
slips through to the unhandled `has-reloaded` state. This is the same class of
crash observed in the field (`GPU process exited unexpectedly: exit_code=15`),
just triggered deterministically here via the CDP command
`Browser.crashGpuProcess`.

## The scenario

`cypress/e2e/a.feature` renders a dashboard for many accounts (a Scenario
Outline with 12 examples — the field crash appeared on specs with >10
scenarios), then a final scenario crashes the GPU process. The steps do real
navigation + assertions against `https://example.org/`, mirroring the plugin's
own `@network` reload tests.

## Prerequisites

- Cypress `< 15.18.0` (this project pins `15.15.0`). On `>= 15.18.0` the
  `has-reloaded` state is unreachable and the bug does not occur.
- A Chromium-family browser with a GPU process (Electron or Chrome).
- Network access **only for `crashMode=cdp`** (it visits `https://example.org/`);
  `crashMode=memory` is fully self-contained.

## Run

```bash
cd debug/repro-cypress
npm install
```

Two switchable modes (via `--env crashMode=...`), same feature:

```bash
# cdp (default) -- deterministic: real navigation + GPU crash forced via CDP.
npx cypress run --browser electron

# memory -- organic & self-contained: no network, no CDP; renders a heavy local
# page and exhausts GPU memory with WebGL until the GPU process crashes itself.
npx cypress run --browser electron --env crashMode=memory
```

Use `cdp` for a reliable, shareable reproduction; use `memory` to reproduce the
raw field scenario (natural memory pressure) — note it's timing-dependent and
may need more scenarios or larger allocations on a high-memory machine.

## Expected result

- **With preprocessor `24.0.1` / current `master`:** the run fails after the
  specs with `Unexpected state in afterSpecHandler: has-reloaded`.
- **With the fix (PR #1365):** the run completes; the report
  (`cucumber-messages.ndjson` / `cucumber-report.json`) is still written with the
  completed scenario preserved.

## Notes

- If the GPU crash doesn't land at the right moment on your machine, increase the
  `cy.wait(...)` in `cypress/support/step_definitions/steps.js`, or add more
  passing scenarios before the crashing one (the field crash appeared on specs
  with >10 scenarios under memory pressure).
- For a browser-independent, 100%-deterministic reproduction of the same event
  sequence, see `../repro-has-reloaded.js`.
