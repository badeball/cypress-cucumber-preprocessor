# https://github.com/badeball/cypress-cucumber-preprocessor/issues/832

@no-default-preprocessor-config
Feature: absolute paths in `stepDefinitions`
  Scenario: absolute paths in `stepDefinitions`
    Given a file named "cypress-cucumber-preprocessor.config.js" with:
      """
      const path = require("node:path")

      module.exports = {
        stepDefinitions: [
          path.join(process.cwd(), "cypress/support/step_definitions/**/*.{js,ts}")
        ]
      };
      """
    And a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario:
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", () => {})
      """
    When I run cypress
    Then it passes
