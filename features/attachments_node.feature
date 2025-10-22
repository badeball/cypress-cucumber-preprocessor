@no-default-plugin
Feature: attachments

  Background:
    Given additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
        }
      }
      """

  Rule: it should support a variety of options

    Scenario: string identity
      Given a file named "setupNodeEvents.js" with:
        """
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach }) {
              attach("foobar");
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/attachments/string.json"

    Scenario: array buffer
      Given a file named "setupNodeEvents.js" with:
        """
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach }) {
              attach(Buffer.from("foobar"), "text/plain");
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/attachments/string.json"

    Scenario: string encoded
      Given a file named "setupNodeEvents.js" with:
        """
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach }) {
              attach(Buffer.from("foobar").toString("base64"), "base64:text/plain");
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/attachments/string.json"

  Rule: it should be invoked with same arguments as AfterStep(), in addition to `results`

    Scenario: etc arguments
      Given a file named "setupNodeEvents.js" with:
        """
        const assert = require("node:assert/strict");
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach, pickle, pickleStep, gherkinDocument, testCaseStartedId, testStepId }) {
              assert.equal(pickle.name, "a scenario name");
              assert.equal(pickleStep.text, "a step");
              assert.equal(gherkinDocument.feature.name, "a feature name");
              assert.equal(typeof testCaseStartedId, "string");
              assert.equal(typeof testStepId, "string");
              attach("success");
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be one attachment containing "success"

    Scenario: passing step
      Given a file named "setupNodeEvents.js" with:
        """
        const assert = require("node:assert/strict");
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach, result }) {
              attach(result.status);
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be one attachment containing "PASSED"

    Scenario: failing step
      Given additional Cypress configuration
        """
        {
          "screenshotOnRunFailure": false
        }
        """
      And a file named "setupNodeEvents.js" with:
        """
        const assert = require("node:assert/strict");
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config, {
            onAfterStep({ attach, result }) {
              attach(result.status);
            }
          });
          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config)]
            })
          );
          return config;
        };
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          throw "some error";
        });
        """
      When I run cypress
      Then it fails
      And there should be one attachment containing "FAILED"
