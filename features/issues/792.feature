# https://github.com/badeball/cypress-cucumber-preprocessor/issues/792

Feature: overriding env
  Scenario: overriding env
    Given a file named "cypress/e2e/foo/bar.feature" with:
      """
      @env(foo="bar")
      @expose(foo="bar")
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/e2e/foo/bar.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", () => {
        expect((Cypress.env ?? Cypress.expose)("foo")).to.equal("bar");
      });
      """
    When I run cypress
    Then it passes
