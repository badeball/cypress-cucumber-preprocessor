Feature: cached source maps

  Ideally, I would have liked to test this in a more behavior driven way, like counting the number
  of times that the bundler, whichever was configured, was invoked. However, it turns out that
  Cypress does in fact cache [1]. Unfortunately, this cache is dead slow and requires higher-order
  caching. The only way to verify that Cypress' cache isn't invoked, is by interpreting stderr.

  [1] https://github.com/cypress-io/cypress/blob/v13.15.0/packages/server/lib/plugins/preprocessor.js#L94-L98

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
      | name                    | value                       |
      | DEBUG                   | cypress:server:preprocessor |
      | ELECTRON_ENABLE_LOGGING | 1                           |
    Then it passes
    # Why two? Who knows. Cypress requests this file twice and the library once.
    And I should see exactly 2 instances of "headless and already processed" in stderr
