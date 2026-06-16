Feature: @only tag

  Rules:
   - In presence of any @only tag, only tests tagged with this should be run
   - This behavior is scoped per file
   - Presence of this tag override any other tag filter

  Scenario: 1 / 2 scenarios tagged with @only
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @only
        Scenario: a scenario
          Given a step

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

  Scenario: 2 / 2 scenarios tagged with @only
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @only
        Scenario: a scenario
          Given a step

        @only
        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear as if both tests ran

  Scenario: 1 / 2 example table tagged with @only
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario Outline: a scenario
          Given a step

        @only
        Examples:
          | value |
          | foo   |

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

  Scenario: 2 / 2 example table tagged with @only
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario Outline: a scenario
          Given a step

        @only
        Examples:
          | value |
          | foo   |

        @only
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
    And it should appear to have run the scenario "a scenario (example #2)"

  Scenario: one file with @only, one without
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @only
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/e2e/b.feature" with:
      """
      Feature: b feature
        Scenario: another scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear to have run the scenario "a scenario"
    And it should appear to have run the scenario "another scenario"

  Scenario: specifying tags
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @only
        Scenario: a scenario
          Given a step

        @foo
        Scenario: another scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function(table) {});
      """
    When I run cypress with env "tags" = "@foo"
    Then it should appear to have run the scenario "a scenario"
    And it should appear to have skipped the scenario "another scenario"

  Scenario: @focus (backwards compatibility)
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        @focus
        Scenario: a scenario
          Given a step

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
