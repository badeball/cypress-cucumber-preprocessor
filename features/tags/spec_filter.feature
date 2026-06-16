Feature: filter spec

  Background:
    Given additional Cypress configuration
      """
      {
        "e2e": {
          "specPattern": "**/*.{spec.js,feature}"
        }
      }
      """
    And additional preprocessor configuration
      """
      {
        "filterSpecs": true
      }
      """
    And a file named "cypress/e2e/foo.feature" with:
      """
      @foo
      Feature: some feature
        Scenario: first scenario
          Given a step
      """
    And a file named "cypress/e2e/bar.feature" with:
      """
      @bar
      Feature: some other feature
        Scenario: second scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    And a file named "cypress/e2e/baz.spec.js" with:
      """
      it("should work", () => {});
      """

  Rule: it should filter features based on whether they contain a matching scenario

    Scenario: 1 / 2 specs matching
      When I run cypress with env "tags" = "@foo"
      Then it passes
      And it should appear to not have ran spec "bar.feature"
      But it should appear to have ran spec "foo.feature"

    Scenario: 2 / 2 specs matching
      When I run cypress with env "tags" = "@foo or @bar"
      Then it passes
      And it should appear to have ran spec "foo.feature" and "bar.feature"

  Rule: filterSpecsMixedMode: hide (default) should hide non-feature specs regardless of tag expression

    Scenario: positive tag expression
      When I run cypress with env "tags" = "@foo"
      Then it passes
      And it should appear to not have ran spec "baz.spec.js"

    Scenario: negative tag expression
      When I run cypress with env "tags" = "not @foo"
      Then it passes
      And it should appear to not have ran spec "baz.spec.js"

  Rule: filterSpecsMixedMode: show should show non-feature specs regardless of tag expression

    Background:
      Given additional preprocessor configuration
        """
        {
          "filterSpecsMixedMode": "show"
        }
        """

    Scenario: positive tag expression
      When I run cypress with env "tags" = "@foo"
      Then it passes
      And it should appear to have ran spec "baz.spec.js"

    Scenario: negative tag expression
      When I run cypress with env "tags" = "not @foo"
      Then it passes
      And it should appear to have ran spec "baz.spec.js"


  Rule: filterSpecsMixedMode: empty-set should filter non-feature specs as if they have tags equalling the empty set

    Background:
      Given additional preprocessor configuration
        """
        {
          "filterSpecsMixedMode": "empty-set"
        }
        """

    Scenario: positive tag expression
      When I run cypress with env "tags" = "@foo"
      Then it passes
      And it should appear to not have ran spec "baz.spec.js"

    Scenario: negative tag expression
      When I run cypress with env "tags" = "not @foo"
      Then it passes
      And it should appear to have ran spec "baz.spec.js"
