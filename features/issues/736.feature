# https://github.com/badeball/cypress-cucumber-preprocessor/issues/736

Feature: create output directories
  Background:
    Given additional preprocessor configuration
      """
      {
        "messages": {
          "enabled": true,
          "output": "foo/cucumber-messages.ndjson"
        },
        "json": {
          "enabled": true,
          "output": "bar/cucumber-report.json"
        },
        "html": {
          "enabled": true,
          "output": "baz/cucumber-report.html"
        },
        "usage": {
          "enabled": true,
          "output": "qux/usage-report.html"
        }
      }
      """

  Scenario:
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    When I run cypress
    Then it passes
