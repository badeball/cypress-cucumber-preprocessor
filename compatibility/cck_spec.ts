import fs from "node:fs/promises";

import path from "node:path";

import assert from "node:assert/strict";

import childProcess from "node:child_process";

import * as messages from "@cucumber/messages";

import * as glob from "glob";

import { stringToNdJson } from "../features/support/helpers";

/**
 * This file is heavily inspired by the cucumber-js' counterpart.
 *
 * @see https://github.com/cucumber/cucumber-js/blob/v10.8.0/compatibility/cck_spec.ts
 */

const IS_WIN = process.platform === "win32";
const PROJECT_PATH = path.join(__dirname, "..");
const CCK_FEATURES_PATH = "node_modules/@cucumber/compatibility-kit/features";
const CCK_IMPLEMENTATIONS_PATH = "compatibility/step_definitions";

// Shamelessly copied form https://github.com/cucumber/cucumber-js/blob/v10.8.0/features/support/formatter_output_helpers.ts#L100-L122
const ignorableKeys = [
  "meta",
  // sources
  "uri",
  "line",
  // ids
  "astNodeId",
  "astNodeIds",
  "hookId",
  "id",
  "pickleId",
  "pickleStepId",
  "stepDefinitionIds",
  "testCaseId",
  "testCaseStartedId",
  "testStepId",
  // time
  "nanos",
  "seconds",
  // errors
  "message",
  "stackTrace",
];

function isObject(object: any): object is object {
  return typeof object === "object" && object != null;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function* traverseTree(object: any): Generator<object, void, any> {
  if (!isObject(object)) {
    throw new Error(`Expected object, got ${typeof object}`);
  }

  yield object;

  for (const property of Object.values(object)) {
    if (isObject(property)) {
      yield* traverseTree(property);
    }
  }
}

function normalizeMessage(message: messages.Envelope): messages.Envelope {
  for (const node of traverseTree(message as any)) {
    for (const ignorableKey of ignorableKeys) {
      if (hasOwnProperty(node, ignorableKey)) {
        delete node[ignorableKey];
      }
    }
  }

  return message;
}

describe("Cucumber Compatibility Kit", () => {
  const ndjsonFiles = glob.sync(`${CCK_FEATURES_PATH}/**/*.ndjson`);

  for (const ndjsonFile of ndjsonFiles) {
    const suiteName = path.basename(path.dirname(ndjsonFile));

    /**
     * Unknown parameter type will generate an exception outside of a Cypress test and halt all
     * execution. Thus, cucumber-js' behavior is tricky to mirror.
     *
     * Markdown is unsupported.
     */
    switch (suiteName) {
      case "unknown-parameter-type":
      case "markdown":
        it.skip(`passes the cck suite for '${suiteName}'`);
        continue;
    }

    it(`passes the cck suite for '${suiteName}'`, async () => {
      const tmpDir = path.join(PROJECT_PATH, "tmp", "compatibility", suiteName);

      await fs.rm(tmpDir, { recursive: true, force: true });

      await fs.mkdir(tmpDir, { recursive: true });

      await fs.writeFile(
        path.join(tmpDir, "cypress.config.js"),
        `
          const { defineConfig } = require("cypress");
          const setupNodeEvents = require("./setupNodeEvents.js");

          module.exports = defineConfig({
            e2e: {
              specPattern: "cypress/e2e/**/*.feature",
              video: false,
              supportFile: false,
              screenshotOnRunFailure: false,
              setupNodeEvents
            }
          });
        `
      );

      await fs.writeFile(
        path.join(tmpDir, ".cypress-cucumber-preprocessorrc"),
        `
          {
            "messages": {
              "enabled": true
            }
          }
        `
      );

      await fs.writeFile(
        path.join(tmpDir, "setupNodeEvents.js"),
        `
          const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
          const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
          const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

          module.exports = async function setupNodeEvents(on, config) {
            await addCucumberPreprocessorPlugin(on, config);

            on(
              "file:preprocessor",
              createBundler({
                plugins: [createEsbuildPlugin(config)],
              })
            );

            return config;
          };
        `
      );

      await fs.mkdir(path.join(tmpDir, "node_modules", "@badeball"), {
        recursive: true,
      });

      await fs.symlink(
        PROJECT_PATH,
        path.join(
          tmpDir,
          "node_modules",
          "@badeball",
          "cypress-cucumber-preprocessor"
        ),
        "dir"
      );

      await fs.mkdir(path.join(tmpDir, "cypress", "e2e"), { recursive: true });

      await fs.copyFile(
        path.join(CCK_FEATURES_PATH, suiteName, `${suiteName}.feature`),
        path.join(tmpDir, "cypress", "e2e", `${suiteName}.feature`)
      );

      if (suiteName === "hooks") {
        await fs.copyFile(
          path.join(CCK_FEATURES_PATH, suiteName, "cucumber.svg"),
          path.join(tmpDir, "cucumber.svg")
        );
      } else if (suiteName === "attachments") {
        const files = ["cucumber.jpeg", "cucumber.png", "document.pdf"];

        for (const file of files) {
          await fs.copyFile(
            path.join(CCK_FEATURES_PATH, suiteName, file),
            path.join(tmpDir, file)
          );
        }
      }

      await fs.mkdir(
        path.join(tmpDir, "cypress", "support", "step_definitions"),
        { recursive: true }
      );

      await fs.copyFile(
        path.join(PROJECT_PATH, CCK_IMPLEMENTATIONS_PATH, `${suiteName}.ts`),
        path.join(
          tmpDir,
          "cypress",
          "support",
          "step_definitions",
          `${suiteName}.ts`
        )
      );

      const args = ["run"];

      if (suiteName === "retry") {
        args.push("-c", "retries=2");
      }

      const child = childProcess.spawn(
        path.join(
          PROJECT_PATH,
          "node_modules",
          ".bin",
          IS_WIN ? "cypress.cmd" : "cypress"
        ),
        args,
        {
          stdio: ["ignore", "pipe", "pipe"],
          cwd: tmpDir,
          // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2
          shell: IS_WIN,
        }
      );

      if (process.env.DEBUG) {
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
      }

      await new Promise((resolve) => {
        child.on("close", resolve);
      });

      const actualMessages = stringToNdJson(
        (
          await fs.readFile(path.join(tmpDir, "cucumber-messages.ndjson"))
        ).toString()
      ).map(normalizeMessage);

      const expectedMessages = stringToNdJson(
        (await fs.readFile(ndjsonFile)).toString()
      ).map(normalizeMessage);

      if (suiteName === "pending") {
        /**
         * We can't control Cypress exit code without failing a test, thus is cucumber-js behavior
         * difficult to mimic.
         */
        actualMessages.forEach((message) => {
          if (message.testRunFinished) {
            message.testRunFinished.success = false;
          }
        });
      } else if (suiteName === "hooks") {
        /**
         * Lack of try-catch in Cypress makes it difficult to mirror cucumber-js behavior in terms
         * of hooks, for which exceptions doesn't halt execution.
         */
        actualMessages.forEach((message) => {
          if (
            message.testStepFinished?.testStepResult.status ===
            messages.TestStepResultStatus.SKIPPED
          ) {
            message.testStepFinished.testStepResult.status =
              messages.TestStepResultStatus.PASSED;
          }
        });
      }

      assert.deepEqual(actualMessages, expectedMessages);
    });
  }
});
