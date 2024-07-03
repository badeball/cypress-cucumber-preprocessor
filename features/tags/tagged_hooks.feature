Feature: tagged Hooks

  Background:
    Given a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Then } = require("@badeball/cypress-cucumber-preprocessor");
      Then("{word} is true", function(prop) {
        expect(true).to.equal(this[prop])
      })
      Then("{word} is false", function(prop) {
        expect(false).to.equal(this[prop])
      })
      """

  Rule: scenario hooks can be filtered using hooks
    Background:
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const {
          Before
        } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() {
          this.foo = false
          this.bar = false
        })
        Before({ tags: "@foo" }, function() {
          this.foo = true
        })
        Before("@bar", function() {
          this.bar = true
        })
        """

    Scenario: filtered by tags on scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature:
          @foo
          Scenario:
            Then foo is true
            And bar is false
        """
      When I run cypress
      Then it passes

    Scenario: tags cascade from feature to scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        @foo
        Feature:
          Scenario:
            Then foo is true
            And bar is false
        """
      When I run cypress
      Then it passes

  Rule: step hooks can be filtered using hooks
    Background:
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const {
          Before, BeforeStep
        } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() {
          this.foo = false
          this.bar = false
        })
        BeforeStep({ tags: "@foo" }, function() {
          this.foo = true
        })
        BeforeStep("@bar", function() {
          this.bar = true
        })
        """

    Scenario: filtered by tags on scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature:
          @foo
          Scenario:
            Then foo is true
            And bar is false
        """
      When I run cypress
      Then it passes

    Scenario: tags cascade from feature to scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        @foo
        Feature:
          Scenario:
            Then foo is true
            And bar is false
        """
      When I run cypress
      Then it passes
