Feature: step definitions

  Rule: it should by default look for step definitions in a couple of locations

    Example: step definitions with same filename
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/e2e/a.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes

    Example: step definitions in a directory with same name
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/e2e/a/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes

    Example: step definitions in a common directory
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes

  Rule: [filePart] should allow for step definitions on multiple levels

    Background:
      Given additional preprocessor configuration
        """
        {
          "stepDefinitions": "cypress/e2e/[filepart]/steps.js"
        }
        """
      And a file named "cypress/e2e/foo/bar/baz/a.feature" with:
        """
        @a
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/e2e/b.feature" with:
        """
        Feature: another feature name
          Scenario: another scenario name
            Given another step
        """

    Scenario: first level
      Given a file named "cypress/e2e/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress with "-e tags=@a"
      Then it passes

    Scenario: second level
      Given a file named "cypress/e2e/foo/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress with "-e tags=@a"
      Then it passes

    Scenario: third level
      Given a file named "cypress/e2e/foo/bar/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress with "-e tags=@a"
      Then it passes

    Scenario: fourth level
      Given a file named "cypress/e2e/foo/bar/baz/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress with "-e tags=@a"
      Then it passes
