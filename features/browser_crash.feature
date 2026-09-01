Feature: browser crash

  # Crash-behavior is a mess, ref. https://github.com/cypress-io/cypress/issues/22631.
  # Pre-12.17.0, enabling video recording actually made a difference, ref. https://github.com/cypress-io/cypress/pull/27167.
  # Post-12.17.0 behavior seems to be consistent enough that it's testable.

  Background:
    Given additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
        }
      }
      """

  Rule: report generation should fail gracefully in the event of a browser crash

    Scenario: Chromium process crash
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, attach } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          new Cypress.Promise(() => {
            Cypress.automation("remote:debugger:protocol", {
              command: "Browser.crash",
            });
          });
        });
        """
      When I run cypress with a chromium-family browser
      Then it fails
      And the output should contain
        """
        Due to browser crash, no reports are created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs

    Scenario: Renderer process crash
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, attach } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          new Cypress.Promise(() => {
            Cypress.automation("remote:debugger:protocol", {
              command: "Page.crash",
            });
          });
        });
        """
      When I run cypress with a chromium-family browser
      Then it fails
      And the output should contain
        """
        Due to browser crash, no reports are created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs
