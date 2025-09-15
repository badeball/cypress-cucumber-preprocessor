Feature: soft state errors

  This essentially requires an edge case which this library does not account for. Currently, there
  a single frontend error which messes with state tracking [1]. In order to simulate a backend
  error, a special flag is used to make the backend misbehave.

  [1] https://github.com/badeball/cypress-cucumber-preprocessor/issues/1222#issuecomment-3056694748

  Background:
    Given additional preprocessor configuration
      """
      {
        "messages": {
          "enabled": true
        }
      }
      """

  Rule: it should fail hard by default upon state errors

    Scenario: throw during Cypress' events
      Given a file named "cypress/e2e/a.feature" with:
        """
        @env(origin="https://google.com/")
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor")
        Given("a step", function() {})
        // Inspired by https://github.com/badeball/cypress-cucumber-preprocessor/issues/1222#issuecomment-3056694748.
        Cypress.on("command:start", (c) => {
          if (typeof c.attributes.args[0] === "function") {
            throw "some error"
          }
        })
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Expected there to be a timestamp for current step
        """
      And there should be no messages report

     Scenario: reload during before()
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor")

        before(() => {
          cy.visit("https://duckduckgo.com/");
        });

        Given("a step", function() {})
        """
      When I run cypress with "-e __cypress_cucumber_preprocessor_dont_use_this_simulate_backend_error=true"
      Then it fails
      And the output should contain
        """
        Unexpected state in beforeSpecHandler: before-spec.
        """
      And there should be no messages report

    Scenario: throw during Cypress' events & soft error enabled
      Given additional preprocessor configuration
        """
        {
          "state": {
            "softErrors": true
          }
        }
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor")
        Given("a step", function() {})
        // Inspired by https://github.com/badeball/cypress-cucumber-preprocessor/issues/1222#issuecomment-3056694748.
        Cypress.on("command:start", (c) => {
          if (typeof c.attributes.args[0] === "function") {
            throw "some error"
          }
        })
        """
      When I run cypress
      Then it fails
      And stderr should contain
        """
        A Cucumber library state error (shown bellow) occured in the frontend, thus no report is created.
        """
      And there should be no messages report

     Scenario: reload during before() & soft error enabled
      Given additional preprocessor configuration
        """
        {
          "state": {
            "softErrors": true
          }
        }
        """
      And a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor")

        before(() => {
          cy.visit("https://duckduckgo.com/");
        });

        Given("a step", function() {})
        """
      When I run cypress with "-e __cypress_cucumber_preprocessor_dont_use_this_simulate_backend_error=true"
      Then it passes
      And stderr should contain
        """
        A Cucumber library state error (shown bellow) occured in the backend, thus no report is created.
        """
      And there should be no messages report
