Feature: reload during 2nd test
  Scenario:
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a noop step
        Scenario: another scenario
          Given a reloading step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a noop step", function() {});
      Given("a reloading step", function() {
        cy.visit("https://duckduckgo.com/");
      });
      """
    When I run cypress
    Then it passes
