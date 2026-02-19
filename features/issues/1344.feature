
# https://github.com/badeball/cypress-cucumber-preprocessor/issues/1344

@network
Feature: JSON report
  Scenario: with BeforeAll hook and reload-behavior
    Given additional preprocessor configuration
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
          When I navigate to "https://duckduckgo.com/"
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { When, BeforeAll } = require("@badeball/cypress-cucumber-preprocessor");
      BeforeAll(() => {})
      When("I navigate to {string}", function(url) {
        cy.visit(url)
      })
      """
    When I run cypress
    Then it passes
