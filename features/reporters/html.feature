Feature: html report
  Background:
    Given additional preprocessor configuration
      """
      {
        "html": {
          "enabled": true
        }
      }
      """

  Scenario: basic report
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    When I run cypress
    Then it passes
    And there should be a HTML report

  Scenario: start time
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {})
      """
    When I run cypress
    Then it passes
    And the report should display when last run

  Scenario: videos
    Given additional Cypress configuration
      """
      {
        "e2e": {
          "video": true
        }
      }
      """
    And additional preprocessor configuration
      """
      {
        "attachments": {
          "addVideos": true
        }
      }
      """
    And a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {});
      """
    When I run cypress
    Then it passes
    And the report should have a video attachment

  Rule: it should obey `omitFiltered`
    Background:
      Given additional preprocessor configuration
        """
        {
          "omitFiltered": true
        }
        """

    Scenario: without tags
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
          Scenario: another scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress
      Then it should appear as if both tests ran
      And the HTML should display 2 executed scenarios

    Scenario: with user-provided tags
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @foobar
          Scenario: a scenario
            Given a step
          Scenario: another scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress with "--env tags=@foobar"
      Then it should appear as if only a single test ran
      And the HTML should display 1 executed scenario

    Scenario: @focus
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @focus
          Scenario: a scenario
            Given a step
          Scenario: another scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress
      Then it should appear as if only a single test ran
      And the HTML should display 1 executed scenario

    Scenario: @skip
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
          @skip
          Scenario: another scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress
      Then it should appear as if only a single test ran
      And the HTML should display 1 executed scenario
