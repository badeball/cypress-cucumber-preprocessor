Feature: cached source maps
  Scenario:
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.ts" with:
      """
      import { Given } from "@badeball/cypress-cucumber-preprocessor";
      Given("a step", function(this: Mocha.Context) {});
      for (let i = 0; i < 10; i++) {
        Given(`an unused step (${i + 1})`, function(this: Mocha.Context) {});
      };
      """
    When I run cypress with environment variables
      | name  | value                       |
      | DEBUG | cypress:server:preprocessor |
    Then it passes
    # Why two? Who knows. Cypress requests this file twice and the library once.
    And I should see exactly 2 instances of "headless and already processed" in stderr
