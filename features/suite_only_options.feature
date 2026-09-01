Feature: suite only options

  Background:
    Given additional Cypress configuration
      """
      {
        "e2e": {
          "testIsolation": true
        }
      }
      """

  Rule: testIsolation is only applicable for Feature / Rule

    Scenario: Configuring testIsolation on a Feature
      Given a file named "cypress/e2e/a.feature" with:
        """
        @testIsolation(false)
        Feature: a feature
          Scenario: a scenario
            Given a step
          Scenario: another scenario
            Then another step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, Then } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", () => {
          cy.get("body").invoke('html', 'Hello world')
        });
        Given("another step", () => {
          cy.contains("Hello world").should("exist");
        });
        """
      When I run cypress
      Then it passes

    Scenario: Configuring testIsolation on a Rule
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @testIsolation(false)
          Rule: a rule
            Scenario: a scenario
              Given a step
            Scenario: another scenario
              Then another step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, Then } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", () => {
          cy.get("body").invoke('html', 'Hello world')
        });
        Given("another step", () => {
          cy.contains("Hello world").should("exist");
        });
        """
      When I run cypress
      Then it passes

    Scenario: Configuring testIsolation on a Scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @testIsolation(false)
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, Then } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", () => {
          cy.get("body").invoke('html', 'Hello world')
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        The `testIsolation` configuration can only be overridden from a suite-level override (in Cucumber-terms this means on a Feature or Rule).
        """

    Scenario: Configuring testIsolation on a Scenario Outline
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @testIsolation(false)
          Scenario Outline: a scenario
            Given a step

            Examples:
              | foo |
              | bar |
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, Then } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", () => {
          cy.get("body").invoke('html', 'Hello world')
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        The `testIsolation` configuration can only be overridden from a suite-level override (in Cucumber-terms this means on a Feature or Rule).
        """

    Scenario: Configuring testIsolation on Examples
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario Outline: a scenario
            Given a step

            @testIsolation(false)
            Examples:
              | foo |
              | bar |
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given, Then } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", () => {
          cy.get("body").invoke('html', 'Hello world')
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        The `testIsolation` configuration can only be overridden from a suite-level override (in Cucumber-terms this means on a Feature or Rule).
        """
