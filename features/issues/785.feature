# https://github.com/badeball/cypress-cucumber-preprocessor/issues/785

Feature: omit filtered tests, creating a different common ancestor path
  Background:
    Given additional preprocessor configuration
      """
      {
        "stepDefinitions": "cypress/e2e/[filepath].js",
        "filterSpecs": true
      }
      """
    And a file named "cypress/e2e/foo/bar.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/e2e/foo/bar.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", () => {})
      """
    And a file named "cypress/e2e/baz/qux.feature" with:
      """
      @qux
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/e2e/baz/qux.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", () => {})
      """

  Scenario: no filtering
    When I run cypress
    Then it passes

  Scenario: with filtering
    When I run cypress with env "tags" = "@qux"
    Then it passes
