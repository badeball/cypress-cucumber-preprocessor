@skip
Feature: named hooks

  Background:
    Given a file named "cypress/e2e/a.feature" with:
      """
      @foo
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    Given a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", () => {});
      """

  Rule: named hooks should be displayed appropriately in the command log

    Scenario: Before hook (untagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { Before } = require("@badeball/cypress-cucumber-preprocessor");
        Before({ name: "foo" }, () => {
          cy.expectCommandLogEntry({
            method: "Before",
            message: "foo"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: Before hook (tagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { Before } = require("@badeball/cypress-cucumber-preprocessor");
        Before({ name: "foo", tags: "@foo" }, () => {
          cy.expectCommandLogEntry({
            method: "Before",
            message: "foo (@foo)"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: After hook (untagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { After } = require("@badeball/cypress-cucumber-preprocessor");
        After({ name: "foo" }, () => {
          cy.expectCommandLogEntry({
            method: "After",
            message: "foo"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: After hook (tagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { After } = require("@badeball/cypress-cucumber-preprocessor");
        After({ name: "foo", tags: "@foo" }, () => {
          cy.expectCommandLogEntry({
            method: "After",
            message: "foo (@foo)"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: BeforeStep hook (untagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep({ name: "foo" }, () => {
          cy.expectCommandLogEntry({
            method: "BeforeStep",
            message: "foo"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: BeforeStep hook (tagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { BeforeStep } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep({ name: "foo", tags: "@foo" }, () => {
          cy.expectCommandLogEntry({
            method: "BeforeStep",
            message: "foo (@foo)"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: AfterStep hook (untagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep({ name: "foo" }, () => {
          cy.expectCommandLogEntry({
            method: "AfterStep",
            message: "foo"
          });
        });
        """
      When I run cypress
      Then it passes

    Scenario: AfterStep hook (tagged)
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { AfterStep } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep({ name: "foo", tags: "@foo" }, () => {
          cy.expectCommandLogEntry({
            method: "AfterStep",
            message: "foo (@foo)"
          });
        });
        """
      When I run cypress
      Then it passes

  Rule: some named hooks should be reported appropriately

    Background:
      Given additional preprocessor configuration
        """
        {
          "messages": {
            "enabled": true
          }
        }
        """

    Scenario: Before hook
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { Before } = require("@badeball/cypress-cucumber-preprocessor");
        Before({ name: "foo" }, () => {});
        """
      When I run cypress
      Then it passes
      And the message report should contain a hook named "foo"

    Scenario: After hook
      Given a file named "cypress/support/step_definitions/hooks.js" with:
        """
        const { After } = require("@badeball/cypress-cucumber-preprocessor");
        After({ name: "foo" }, () => {});
        """
      When I run cypress
      Then it passes
      And the message report should contain a hook named "foo"
