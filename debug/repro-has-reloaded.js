/*
 * ============================================================================
 *  Reproduction harness: "Unexpected state in afterSpecHandler: has-reloaded"
 * ============================================================================
 *
 * WHAT IT REPRODUCES
 *   The crash reported in https://github.com/badeball/cypress-cucumber-preprocessor/pull/1365.
 *   It drives the COMPILED plugin state machine (dist/) through the event
 *   sequence that a mid/late-spec browser (GPU / renderer) crash produces on
 *   Cypress < 15.18.0:
 *
 *     before:run
 *       -> before:spec                     (state: before-spec)
 *       -> specEnvelopes                   (state: received-envelopes)
 *       -> testCaseStarted                 (state: test-started)
 *       -> testCaseFinished                (state: test-finished)   << scenario passes
 *       -> before:spec  (crash re-fires!)  (state: has-reloaded)    << reload, no re-run
 *       -> after:spec                      (THROWS on master / OK once fixed)
 *       -> after:run                       (writes the report)
 *
 *   A browser crash re-fires before:spec but does NOT re-run the spec, so the
 *   plugin never receives a fresh specEnvelopes and is stuck in "has-reloaded"
 *   when after:spec arrives.
 *
 * WHY A SCRIPT AND NOT A CYPRESS SPEC
 *   The real-world trigger is a non-deterministic renderer/GPU crash, which
 *   cannot be scripted reliably in a .feature. This harness reproduces the
 *   exact resulting event sequence deterministically. The equivalent assertion
 *   also lives in lib/plugin-event-handlers.test.ts (run via `npm run test:unit`).
 *
 * PREREQUISITES
 *   - Cypress < 15.18.0 installed (on >= 15.18.0 the state is unreachable):
 *         npm install --no-save cypress@15.15.0
 *   - The plugin built to dist/:
 *         npm run build
 *
 * RUN (from anywhere)
 *     node debug/repro-has-reloaded.js
 *   With internal plugin tracing:
 *     DEBUG=cypress-cucumber-preprocessor node debug/repro-has-reloaded.js
 *   Step through in a debugger:
 *     node --inspect-brk debug/repro-has-reloaded.js
 *   ... then breakpoint dist/plugin-event-handlers.js afterSpecHandler.
 * ============================================================================
 */
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

const REPO = process.env.REPO || path.join(__dirname, "..");
const H = require(path.join(REPO, "dist/plugin-event-handlers.js"));

const TS = { seconds: 0, nanos: 0 };

async function step(label, fn) {
  process.stdout.write(`  -> ${label} ... `);
  await fn();
  console.log("ok");
}

async function main() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ccp-repro-"));
  fs.writeFileSync(
    path.join(projectRoot, ".cypress-cucumber-preprocessorrc.json"),
    JSON.stringify({ messages: { enabled: true, output: "messages.ndjson" } }),
  );

  const config = {
    isTextTerminal: true,
    projectRoot,
    testingType: "e2e",
    reporter: "spec",
    env: { testRunStartedId: "trs-1" },
  };
  const spec = {
    name: "a.feature",
    relative: "cypress/e2e/a.feature",
    absolute: path.join(projectRoot, "cypress", "e2e", "a.feature"),
    fileExtension: ".feature",
    fileName: "a",
    specType: "integration",
  };
  const specResults = { error: null, tests: [], relative: spec.relative };
  const runResults = { totalFailed: 0, runs: [] };

  console.log(`project: ${projectRoot}\n`);

  await step("before:run", () => H.beforeRunHandler(config));
  await step("before:spec", () => H.beforeSpecHandler(config, spec));
  await step("task: specEnvelopes", () =>
    H.specEnvelopesHandler(config, {
      messages: [{ testCase: { id: "tc-1", pickleId: "p-1", testSteps: [] } }],
    }),
  );
  await step("task: testCaseStarted", () =>
    H.testCaseStartedHandler(config, {
      id: "tcs-1",
      testCaseId: "tc-1",
      attempt: 0,
      timestamp: TS,
    }),
  );
  await step("task: testCaseFinished (scenario passes)", () =>
    H.testCaseFinishedHandler(config, {
      testCaseStartedId: "tcs-1",
      willBeRetried: false,
      timestamp: TS,
    }),
  );
  await step("before:spec AGAIN (browser crash recovery)", () =>
    H.beforeSpecHandler(config, spec),
  );
  await step("after:spec  <-- the crashing call", () =>
    H.afterSpecHandler(config, spec, specResults),
  );
  await step("after:run", () => H.afterRunHandler(config, runResults));

  const report = fs.readFileSync(
    path.join(projectRoot, "messages.ndjson"),
    "utf8",
  );
  const preserved =
    /"testCaseStarted"/.test(report) && /"testCaseFinished"/.test(report);
  console.log(
    `\nreport written: ${path.join(projectRoot, "messages.ndjson")}` +
      `\nscenario preserved in report: ${preserved ? "YES" : "NO"}`,
  );
}

main().then(
  () => console.log("\n==> RESULT: completed without crashing (fix present)."),
  (err) => {
    console.log("\n==> RESULT: CRASHED (bug present):");
    console.log("    " + (err && err.message ? err.message : String(err)));
    process.exitCode = 1;
  },
);
