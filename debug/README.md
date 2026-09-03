# Debug harnesses

Standalone scripts for reproducing bugs against the compiled plugin (`dist/`).
They are not part of the published package or the test suite.

## `repro-has-reloaded.js`

Reproduces `Unexpected state in afterSpecHandler: has-reloaded`
([#1365](https://github.com/badeball/cypress-cucumber-preprocessor/pull/1365)).

The real-world trigger is a mid/late-spec browser (GPU / renderer) crash on
Cypress `<15.18.0`: Cypress recovers by re-firing `before:spec` *after* the last
scenario has finished, so the state machine reaches `after:spec` while still in
`has-reloaded`. That crash is non-deterministic and can't be scripted in a
`.feature`, so this harness drives the compiled state machine through the exact
resulting event sequence instead. The equivalent assertion also lives in
[`lib/plugin-event-handlers.test.ts`](../lib/plugin-event-handlers.test.ts).

### Prerequisites

```bash
npm install --no-save cypress@15.15.0   # must be <15.18.0 (state is unreachable otherwise)
npm run build                            # build master to see the crash, the fix to see it pass
```

### Run

```bash
node debug/repro-has-reloaded.js                                   # plain
DEBUG=cypress-cucumber-preprocessor node debug/repro-has-reloaded.js   # + internal tracing
node --inspect-brk debug/repro-has-reloaded.js                     # step in a debugger
```

On `master` it prints `CRASHED (bug present)` with the exact error; with the fix
it completes and confirms the finished scenario is preserved in the report.
