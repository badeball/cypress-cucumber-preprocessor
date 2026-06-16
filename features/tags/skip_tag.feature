Feature: @skip tag

  Rules:
   - Tests tagged with @skip are skipped
   - Presence of this tag override any other tag filter

  Scenario: 1 / 2 scenarios tagged with @skip
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step

        @skip
        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear to have run the scenario "a scenario"
    And it should appear to have skipped the scenario "another scenario"

  Scenario: 2 / 2 scenarios tagged with @skip
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @skip
        Scenario: a scenario
          Given a step

        @skip
        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear as if both tests were skipped

  Scenario: 1 / 2 example table tagged with @skip
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario Outline: a scenario
          Given a step

        Examples:
          | value |
          | foo   |

        @skip
        Examples:
          | value |
          | bar   |

        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear to have run the scenario "a scenario (example #1)"
    And it should appear to have skipped the scenario "a scenario (example #2)"

  Scenario: 2 / 2 example table tagged with @skip
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario Outline: a scenario
          Given a step

        @skip
        Examples:
          | value |
          | foo   |

        @skip
        Examples:
          | value |
          | bar   |

        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear to have skipped the scenario "a scenario (example #1)"
    And it should appear to have skipped the scenario "a scenario (example #2)"

  Scenario: specifying tags
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @foo
        @skip
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress with env "tags" = "@foo"
    Then it should appear to have skipped the scenario "a scenario"
