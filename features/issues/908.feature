# https://github.com/badeball/cypress-cucumber-preprocessor/issues/908

Feature: hide internals from cypress environment
  Scenario:
    And a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: hide internal state by default
          Then the visible internal state should be stringified to a replacement text
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Then, getInternalValue } = require("@badeball/cypress-cucumber-preprocessor");
      Then("the visible internal state should be stringified to a replacement text", () => {
        const internalProperties = JSON.parse(JSON.stringify(getInternalValue("__cypress_cucumber_preprocessor_dont_use_this_spec")));
        expect(internalProperties).to.equal("Internal properties of cypress-cucumber-preprocessor omitted from report.");
      });
      """
    When I run cypress
    Then it passes
