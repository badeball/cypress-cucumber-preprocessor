@no-default-plugin
Feature: experimental source map

  Background:
    Given additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
        }
      }
      """

  Rule: it should work with esbuild

    Background:
      Given a file named "setupNodeEvents.js" with:
        """
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
        const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config);

          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin(config, { prettySourceMap: true })]
            })
          );

          return config;
        }
        """

    Scenario: ambiguous step definitions
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        Given(/a step/, function() {});
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Multiple matching step definitions for: a step
         a step - cypress/support/step_definitions/steps.js:2
         /a step/ - cypress/support/step_definitions/steps.js:3
        """

    Scenario: json report
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Before, After, Given } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() {});
        After(function() {});
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/experimental-source-map.json"

  Rule: it should work with webpack

    Background:
      Given a file named "setupNodeEvents.js" with:
        """
        const webpack = require("@cypress/webpack-preprocessor");
        const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");

        module.exports = async (on, config) => {
          await addCucumberPreprocessorPlugin(on, config);

          on(
            "file:preprocessor",
            webpack({
              webpackOptions: {
                resolve: {
                  extensions: [".ts", ".js"]
                },
                module: {
                  rules: [
                    {
                      test: /\.feature$/,
                      use: [
                        {
                          loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                          options: config
                        }
                      ]
                    }
                  ]
                }
              }
            })
          );

          return config;
        };
        """

    Scenario: ambiguous step definitions
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        Given(/a step/, function() {});
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Multiple matching step definitions for: a step
         a step - cypress/support/step_definitions/steps.js:2
         /a step/ - cypress/support/step_definitions/steps.js:3
        """

    Scenario: json report
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Before, After, Given } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() {});
        After(function() {});
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/experimental-source-map.json"
