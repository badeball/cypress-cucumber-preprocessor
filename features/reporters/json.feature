Feature: JSON formatter

  Background:
    Given additional preprocessor configuration
      """
      {
        "json": {
          "enabled": true
        }
      }
      """

  Rule: it should handle basic scenarioes
    Background:
      Given additional Cypress configuration
        """
        {
          "screenshotOnRunFailure": false
        }
        """

    Scenario: passed example
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
      And there should be a JSON output similar to "fixtures/passed-example.json"

    Scenario: passed outline
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario Outline: a scenario
            Given a step
            Examples:
              | value |
              | foo   |
              | bar   |
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/passed-outline.json"

    Scenario: multiple features
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/e2e/b.feature" with:
        """
        Feature: another feature
          Scenario: another scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {})
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-features.json"

    Scenario: failing step
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And a failing step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a preceding step", function () {})
        Given("a failing step", function() {
          throw "some error"
        })
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/failing-step.json"

    Scenario: undefined step
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And an undefined step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a preceding step", function () {})
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/undefined-steps.json"

    Scenario: pending step
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
        Given("a pending step", function () {
          return "pending";
        });
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/pending-steps.json"

    Scenario: skipped step through return value
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
        Given("a skipped step", function () {
          return "skipped";
        });
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-steps.json"

    Scenario: skipped step through method invocation
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
        Given("a skipped step", function () {
          this.skip();
        });
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-steps.json"

    Scenario: retried
      Given additional Cypress configuration
        """
        {
          "retries": 1
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
        let attempt = 0;
        Given("a step", () => {
          if (attempt++ === 0) {
            throw "some error";
          }
        });
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/passed-example.json"

    Scenario: rescued error
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a failing step
            And an unimplemented step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a failing step", function() {
          throw new Error("foobar")
        })
        """
      And a file named "cypress/support/e2e.js" with:
        """
        Cypress.on("fail", (err) => {
          if (err.message.includes("foobar")) {
            return;
          }

          throw err;
        })
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/rescued-error.json"

    Scenario: failing Before hook
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Before, Given } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() {
          throw "some error"
        })
        Given("a step", function() {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/failing-before.json"

    Scenario: failing After hook
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { After, Given } = require("@badeball/cypress-cucumber-preprocessor");
        After(function() {
          throw "some error"
        })
        Given("a step", function() {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/failing-after.json"

  Rule: step hooks affects the result of the current step
    Background:
      Given additional Cypress configuration
        """
        {
          "screenshotOnRunFailure": false
        }
        """

    Scenario: failing BeforeStep
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And a failing step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { BeforeStep, Given } = require("@badeball/cypress-cucumber-preprocessor");
        BeforeStep(function({ pickleStep }) {
          if (pickleStep.text === "a failing step") {
            throw "some error"
          }
        })
        Given("a preceding step", function () {})
        Given("a failing step", function() {})
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/failing-step.json"

    Scenario: failing AfterStep
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a preceding step
            And a failing step
            And a succeeding step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { AfterStep, Given } = require("@badeball/cypress-cucumber-preprocessor");
        AfterStep(function({ pickleStep }) {
          if (pickleStep.text === "a failing step") {
            throw "some error"
          }
        })
        Given("a preceding step", function () {})
        Given("a failing step", function() {})
        Given("a succeeding step", function () {})
        """
      When I run cypress
      Then it fails
      And there should be a JSON output similar to "fixtures/failing-step.json"

  Rule: it should by default contain screenshots captured during a test
    Scenario: explicit screenshot
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function () {
          cy.visit("index.html");
          cy.get("div").screenshot();
        });
        """
      And a file named "index.html" with:
        """
        <!DOCTYPE HTML>
        <style>
          div {
            background: red;
            width: 20px;
            height: 20px;
          }
        </style>
        <div />
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/attachments/screenshot.json"

    Scenario: screenshot of failed test
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a failing step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a failing step", function() {
          throw "some error"
        })
        """
      When I run cypress
      Then it fails
      And the JSON report should contain an image attachment for what appears to be a screenshot

    Scenario: with screenshots disabled
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: a scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          cy.screenshot();
        });
        """
      When I run cypress with "-e attachmentsAddScreenshots=false"
      Then it passes
      And there should be a JSON output similar to "fixtures/passed-example.json"

  Rule: it should include results of skipped (not omitted) tests
    Scenario: first scenario skipped
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @skip
          Scenario: first scenario
            Given a step
          Scenario: second scenario
            Given a step
          Scenario: third scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function () {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-first-scenario.json"

    Scenario: middle scenario skipped
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: first scenario
            Given a step
          @skip
          Scenario: second scenario
            Given a step
          Scenario: third scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function () {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-second-scenario.json"

    Scenario: last scenario skipped
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          Scenario: first scenario
            Given a step
          Scenario: second scenario
            Given a step
          @skip
          Scenario: third scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function () {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-third-scenario.json"

    Scenario: all scenario skipped
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @skip
          Scenario: first scenario
            Given a step
          @skip
          Scenario: second scenario
            Given a step
          @skip
          Scenario: third scenario
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function () {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/skipped-all-scenarios.json"

  Rule: failing Cypress hooks outside of the plugins control should discontinue the report
    Scenario: failing before hook
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
      And a file named "cypress/support/e2e.js" with:
        """
        before(() => {
          throw "some error"
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Hook failures can't be represented in any reports (messages / json / html), thus none is created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs

    Scenario: failing beforeEach hook
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
      And a file named "cypress/support/e2e.js" with:
        """
        beforeEach(() => {
          throw "some error"
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Hook failures can't be represented in any reports (messages / json / html), thus none is created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs

    Scenario: failing afterEach hook
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
      And a file named "cypress/support/e2e.js" with:
        """
        afterEach(() => {
          throw "some error"
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Hook failures can't be represented in any reports (messages / json / html), thus none is created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs

    Scenario: failing after hook
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
      And a file named "cypress/support/e2e.js" with:
        """
        after(() => {
          throw "some error"
        });
        """
      When I run cypress
      Then it fails
      And the output should contain
        """
        Hook failures can't be represented in any reports (messages / json / html), thus none is created for cypress/e2e/a.feature.
        """
      And the JSON report shouldn't contain any specs

  @network
  Rule: it should handle reloads gracefully in a multitude of scenarios

    Background:
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature
          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario
            Given a step

          @env(origin="https://google.com/")
          Scenario: another scenario
            Given another step
        """

    Scenario: base case
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        Given("a step", function() {});

        Given("another step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"

    Scenario: reloading within steps
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        Given("a step", function() {
          cy.visit("https://duckduckgo.com/");
        });

        Given("another step", function() {
          cy.visit("https://google.com/");
        });
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"

    Scenario: reloading in before()
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        before(() => {
          cy.visit("https://duckduckgo.com/");
        });

        Given("a step", function() {});

        Given("another step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"

    Scenario: reloading in after()
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        after(() => {
          cy.visit("https://duckduckgo.com/");
        });

        Given("a step", function() {});

        Given("another step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"

    Scenario: reloading in beforeEach()
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        beforeEach(() => {
          cy.visit(Cypress.env("origin"));
        });

        Given("a step", function() {});

        Given("another step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"

    Scenario: reloading in afterEach()
      Given a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");

        afterEach(() => {
          cy.visit(Cypress.env("origin"));
        });

        Given("a step", function() {});

        Given("another step", function() {});
        """
      When I run cypress
      Then it passes
      And there should be a JSON output similar to "fixtures/multiple-scenarios-reloaded.json"
