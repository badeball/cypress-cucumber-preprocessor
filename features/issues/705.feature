# https://github.com/badeball/cypress-cucumber-preprocessor/issues/705

@no-default-plugin
Feature: overriding event handlers
  Background:
    Given additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
        }
      }
      """

  Scenario: overriding after:screenshot
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a failing step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a failing step", function() {
        throw "some error"
      })
      """
    And a file named "setupNodeEvents.js" with:
      """
      const { addCucumberPreprocessorPlugin, afterScreenshotHandler } = require("@badeball/cypress-cucumber-preprocessor");
      const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
      const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

      module.exports = async (on, config) => {
        await addCucumberPreprocessorPlugin(on, config, { omitAfterScreenshotHandler: true });

        on("after:screenshot", (details) => afterScreenshotHandler(config, details))

        on(
          "file:preprocessor",
          createBundler({
            plugins: [createEsbuildPlugin(config)]
          })
        );

        return config;
      }
      """

    When I run cypress
    Then it fails
    And the JSON report should contain an image attachment for what appears to be a screenshot
