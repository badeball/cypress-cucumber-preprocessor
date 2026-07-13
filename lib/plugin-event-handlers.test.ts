import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as messages from "@cucumber/messages";
import { version as cypressVersion } from "cypress/package.json";

import {
  afterRunHandler,
  afterSpecHandler,
  beforeRunHandler,
  beforeSpecHandler,
  specEnvelopesHandler,
  testCaseFinishedHandler,
  testCaseStartedHandler,
} from "./plugin-event-handlers";

/**
 * The "has-reloaded" state is only reachable prior to Cypress v15.18.0, where a
 * reload re-fires before:spec. On later versions the state machine never enters
 * it, so there's nothing to assert.
 */
function isPre15_18() {
  const [major, minor] = cypressVersion
    .split(".")
    .map((part) => parseInt(part, 10));
  return major < 15 || (major === 15 && minor < 18);
}

const TIMESTAMP: messages.Timestamp = { seconds: 0, nanos: 0 };

/**
 * A browser (GPU / renderer) crash mid-spec makes Cypress recover by re-firing
 * before:spec *after* the last scenario has already finished, without the spec's
 * before-hook re-emitting spec envelopes. This lands the state machine in
 * "has-reloaded" when after:spec fires. This suite drives that exact sequence
 * against the real handlers and asserts that after:spec doesn't crash and that
 * the already-completed messages are preserved in the report (rather than being
 * discarded or throwing "Unexpected state in afterSpecHandler: has-reloaded").
 */
(isPre15_18() ? describe : describe.skip)(
  "reload-behavior after the last test (crash recovery)",
  () => {
    it("doesn't crash after:spec and preserves the report", async () => {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ccp-test-"));

      fs.writeFileSync(
        path.join(projectRoot, ".cypress-cucumber-preprocessorrc.json"),
        JSON.stringify({
          messages: { enabled: true, output: "messages.ndjson" },
        }),
      );

      const config = {
        isTextTerminal: true,
        projectRoot,
        testingType: "e2e",
        reporter: "spec",
        env: { testRunStartedId: "test-run-started-id" },
      } as unknown as Cypress.PluginConfigOptions;

      const spec = {
        name: "a.feature",
        relative: "cypress/e2e/a.feature",
        absolute: path.join(projectRoot, "cypress", "e2e", "a.feature"),
        fileExtension: ".feature",
        fileName: "a",
        specType: "integration",
      } as Cypress.Spec;

      await beforeRunHandler(config);
      await beforeSpecHandler(config, spec);
      await specEnvelopesHandler(config, {
        messages: [
          { testCase: { id: "tc-1", pickleId: "p-1", testSteps: [] } },
        ],
      });

      // A scenario runs to completion -> state "test-finished".
      await testCaseStartedHandler(config, {
        id: "tcs-1",
        testCaseId: "tc-1",
        attempt: 0,
        timestamp: TIMESTAMP,
      });
      await testCaseFinishedHandler(config, {
        testCaseStartedId: "tcs-1",
        willBeRetried: false,
        timestamp: TIMESTAMP,
      });

      // Browser crash recovery re-fires before:spec -> state "has-reloaded".
      await beforeSpecHandler(config, spec);

      // Used to throw "Unexpected state in afterSpecHandler: has-reloaded".
      await afterSpecHandler(config, spec, {
        error: null,
        tests: [],
        relative: spec.relative,
      } as unknown as CypressCommandLine.RunResult);

      await afterRunHandler(config, {
        totalFailed: 0,
        runs: [],
      } as unknown as CypressCommandLine.CypressRunResult);

      const report = fs.readFileSync(
        path.join(projectRoot, "messages.ndjson"),
        "utf8",
      );

      // The completed scenario must be preserved in the report, not discarded.
      assert.match(report, /"testCaseStarted"/);
      assert.match(report, /"testCaseFinished"/);
      assert.match(report, /tcs-1/);
      assert.match(report, /tc-1/);
    });
  },
);
