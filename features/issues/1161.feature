# https://github.com/badeball/cypress-cucumber-preprocessor/issues/1161

@network
Feature: reload-behavior in a retried test
  Scenario:
    Given additional Cypress configuration
      """
      {
        "retries": 1
      }
      """
    And additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
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
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      let attempt = 0;
      Given("a step", function() {
        if (document.domain !== "duckduckgo.com") {
          if (attempt++ === 0) {
            throw "some error";
          } else {
            cy.visit("https://duckduckgo.com/");
          }
        } else {
          // 2. retry reloaded.
        }
      });
      """
    When I run cypress
    Then it passes
