@no-default-plugin
Feature: usage report

  Background:
    Given additional preprocessor configuration
      """
      {
        "usage": {
          "enabled": true
        }
      }
      """
    And a file named "setupNodeEvents.js" with:
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

  Rule: it is outputted to stdout by default

    Scenario: default
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
        """
      When I run cypress
      Then the output should contain a usage report
        """
          ┌────────────────┬──────────┬─────────────────────────────────────────────┐
          │ Pattern / Text │ Duration │ Location                                    │
          ├────────────────┼──────────┼─────────────────────────────────────────────┤
          │ a step         │ 0.00ms   │ cypress/support/step_definitions/steps.js:2 │
          │   a step       │ 0.00ms   │ cypress/e2e/a.feature:3                     │
          └────────────────┴──────────┴─────────────────────────────────────────────┘
        """

    Scenario: custom location
      Given additional preprocessor configuration
        """
        {
          "usage": {
            "enabled": true,
            "output": "usage-report.txt"
          }
        }
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
      Then there should be a usage report named "usage-report.txt" containing
        """
        ┌────────────────┬──────────┬─────────────────────────────────────────────┐
        │ Pattern / Text │ Duration │ Location                                    │
        ├────────────────┼──────────┼─────────────────────────────────────────────┤
        │ a step         │ 0.00ms   │ cypress/support/step_definitions/steps.js:2 │
        │   a step       │ 0.00ms   │ cypress/e2e/a.feature:3                     │
        └────────────────┴──────────┴─────────────────────────────────────────────┘
        """

  Rule: usage should be grouped by step definition
    Scenario: one definition
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
        """
      When I run cypress
      Then the output should contain a usage report
        """
          ┌────────────────┬──────────┬─────────────────────────────────────────────┐
          │ Pattern / Text │ Duration │ Location                                    │
          ├────────────────┼──────────┼─────────────────────────────────────────────┤
          │ a step         │ 0.00ms   │ cypress/support/step_definitions/steps.js:2 │
          │   a step       │ 0.00ms   │ cypress/e2e/a.feature:3                     │
          └────────────────┴──────────┴─────────────────────────────────────────────┘
        """

    Scenario: one definition, repeated
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
            And a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        let count = 0;
        Given("a step", function() {
          // This makes sure a.feature:3 is takes longest and is printed top-post.
          if (count++ === 0) {
            cy.wait(1000);
          }
        });
        """
      When I run cypress
      Then the output should contain a usage report
        """
          ┌────────────────┬───────────┬─────────────────────────────────────────────┐
          │ Pattern / Text │ Duration  │ Location                                    │
          ├────────────────┼───────────┼─────────────────────────────────────────────┤
          │ a step         │ 0.00ms    │ cypress/support/step_definitions/steps.js:3 │
          │   a step       │ 0.00ms    │ cypress/e2e/a.feature:3                     │
          │   a step       │ 0.00ms    │ cypress/e2e/a.feature:4                     │
          └────────────────┴───────────┴─────────────────────────────────────────────┘
        """

    Scenario: two definitions
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
            And another step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          // This makes sure "a step" takes longest and is printed top-post.
          cy.wait(1000);
        });
        Given("another step", function() {});
        """
      When I run cypress
      Then the output should contain a usage report
        """
          ┌────────────────┬───────────┬─────────────────────────────────────────────┐
          │ Pattern / Text │ Duration  │ Location                                    │
          ├────────────────┼───────────┼─────────────────────────────────────────────┤
          │ a step         │ 0.00ms    │ cypress/support/step_definitions/steps.js:2 │
          │   a step       │ 0.00ms    │ cypress/e2e/a.feature:3                     │
          ├────────────────┼───────────┼─────────────────────────────────────────────┤
          │ another step   │ 0.00ms    │ cypress/support/step_definitions/steps.js:6 │
          │   another step │ 0.00ms    │ cypress/e2e/a.feature:4                     │
          └────────────────┴───────────┴─────────────────────────────────────────────┘
        """

    Scenario: two features
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      Given a file named "cypress/e2e/b.feature" with:
        """
        Feature: another feature name
          Scenario: another scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function ({ pickle }) {
          // This makes sure a.feature takes longest and is printed top-post.
          if (pickle.name === "a scenario name") {
            cy.wait(1000);
          }
        });
        Given("a step", function() {});
        """
      When I run cypress
      Then the output should contain a usage report
        """
          ┌────────────────┬───────────┬─────────────────────────────────────────────┐
          │ Pattern / Text │ Duration  │ Location                                    │
          ├────────────────┼───────────┼─────────────────────────────────────────────┤
          │ a step         │ 0.00ms    │ cypress/support/step_definitions/steps.js:8 │
          │   a step       │ 0.00ms    │ cypress/e2e/a.feature:3                     │
          │   a step       │ 0.00ms    │ cypress/e2e/b.feature:3                     │
          └────────────────┴───────────┴─────────────────────────────────────────────┘
        """
