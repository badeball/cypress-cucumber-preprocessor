Feature: step hooks

  Background:
    Given additional preprocessor configuration
      """
      {
        "messages": {
          "enabled": true
        }
      }
      """

  Rule: skipped step hooks should affect the step result

    Background:
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And a skipped step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a preceding step", function () {})
        Given("a skipped step", function() {})
        Given("a succeeding step", function () {})
        """

    Scenario: returning literal 'skipped' in BeforeStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function ({ pickleStep }) {
          if (pickleStep.text === "a skipped step") {
            return "skipped";
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/skipped-steps.ndjson"

    Scenario: returning wrapped 'skipped' in BeforeStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function ({ pickleStep }) {
          if (pickleStep.text === "a skipped step") {
            return cy.wrap("skipped");
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/skipped-steps.ndjson"

    Scenario: returning literal 'skipped' in AfterStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep(function ({ pickleStep }) {
          if (pickleStep.text === "a skipped step") {
            return "skipped";
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/skipped-steps.ndjson"

    Scenario: returning wrapped 'skipped' in AfterStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep(function ({ pickleStep }) {
          if (pickleStep.text === "a skipped step") {
            return cy.wrap("skipped");
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/skipped-steps.ndjson"

  Rule: pending step hooks should affect the step result

    Background:
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And a pending step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a preceding step", function () {})
        Given("a pending step", function() {})
        Given("a succeeding step", function () {})
        """

    Scenario: returning literal 'pending' in BeforeStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function ({ pickleStep }) {
          if (pickleStep.text === "a pending step") {
            return "pending";
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/pending-steps.ndjson"

    Scenario: returning wrapped 'pending' in BeforeStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function ({ pickleStep }) {
          if (pickleStep.text === "a pending step") {
            return cy.wrap("pending");
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/pending-steps.ndjson"

    Scenario: returning literal 'pending' in AfterStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep(function ({ pickleStep }) {
          if (pickleStep.text === "a pending step") {
            return "pending";
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/pending-steps.ndjson"

    Scenario: returning wrapped 'pending' in AfterStep
      Given  a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep(function ({ pickleStep }) {
          if (pickleStep.text === "a pending step") {
            return cy.wrap("pending");
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a messages similar to "fixtures/pending-steps.ndjson"
