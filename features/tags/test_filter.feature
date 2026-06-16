Feature: test filter

  Scenario: with omitFiltered = false (default)
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: some feature
        Rule: first rule
          @foo
          Scenario: first scenario
            Given a step

        Rule: second rule
          Scenario: second scenario
            Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    When I run cypress with env "tags" = "@foo"
    Then it passes
    And it should appear to have skipped the scenario "second scenario"

  Scenario: with omitFiltered = true
    Given additional preprocessor configuration
      """
      {
        "omitFiltered": true
      }
      """
    And a file named "cypress/e2e/a.feature" with:
      """
      Feature: some feature
        Rule: first rule
          @foo
          Scenario: first scenario
            Given a step

        Rule: second rule
          Scenario: second scenario
            Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    When I run cypress with env "tags" = "@foo"
    Then it passes
    And it should appear as if only a single test ran
    And I should not see "second rule" in the output
