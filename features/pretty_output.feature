Feature: pretty output

  Background:
    Given additional Cypress configuration
      """
      {
        "reporter": "@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/pretty-reporter.js"
      }
      """

  Rule: it should handle basic scenarios

    Scenario: passing scenario
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
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0
      """

    Scenario: multiple, passing scenarios
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
          Scenario: another scenario name
            Given another step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a/another step", function() {});
        """
      When I run cypress
      Then it passes
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0

          Scenario: another scenario name # cypress/e2e/a.feature:4
            ✔ Given another step          # not available:0
      """

    Scenario: multiple, passing features
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      Given a file named "cypress/e2e/b.feature" with:
        """
        Feature: another feature name
          Scenario: another scenario name
            Given another step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a/another step", function() {});
        """
      When I run cypress
      Then it passes
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0
      """
      And the output should contain
      """
        Feature: another feature name

          Scenario: another scenario name # cypress/e2e/b.feature:2
            ✔ Given another step          # not available:0
      """

    Scenario: scenario with rule
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Rule: a rule
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
      And the output should contain
      """
        Feature: a feature name

          Rule: a rule

            Scenario: a scenario name # cypress/e2e/a.feature:3
              ✔ Given a step          # not available:0
      """

    @skip
    Scenario: described feature
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name

          foobar

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
      And the output should contain
      """
        Feature: a feature name

          foobar

          Scenario: a scenario name # cypress/e2e/a.feature:5
            ✔ Given a step          # not available:0
      """

    @skip
    Scenario: tagged feature
      Given a file named "cypress/e2e/a.feature" with:
        """
        @foobar
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
      And the output should contain
      """
        @foobar
        Feature: a feature name

          @foobar
          Scenario: a scenario name # cypress/e2e/a.feature:3
            ✔ Given a step          # not available:0
      """

    Scenario: tagged scenario
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          @foobar
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
      And the output should contain
      """
        Feature: a feature name

          @foobar
          Scenario: a scenario name # cypress/e2e/a.feature:3
            ✔ Given a step          # not available:0
      """

    Scenario: docstring
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
              \"\"\"
              foobar
              \"\"\"

        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0
                \"\"\"
                foobar
                \"\"\"
      """

    Scenario: datatable
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
              | foo |
              | bar |

        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {});
        """
      When I run cypress
      Then it passes
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0
                | foo |
                | bar |
      """

    Scenario: failing step
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() { throw "some error" });
        """
      When I run cypress
      Then it fails
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✘ Given a step          # not available:0
                  some error
      """

    Scenario: failing before hook
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            ✔ Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Before, Given } = require("@badeball/cypress-cucumber-preprocessor");
        Before(function() { throw "some error" });
        Given("a step", function() {});
        """
      When I run cypress
      Then it fails
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
                  some error
      """

    Scenario: failing after hook
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { After, Given } = require("@badeball/cypress-cucumber-preprocessor");
        After(function() { throw "some error" });
        Given("a step", function() {});
        """
      When I run cypress
      Then it fails
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✔ Given a step          # not available:0
                  some error
      """

    Scenario: ambiguous step
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
        Given("a step", function() {});
        """
      When I run cypress
      Then it fails
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ✘ Given a step
                  Multiple matching step definitions for: a step
                   a step
                   a step
      """

    Scenario: pending step
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        const { Given } = require("@badeball/cypress-cucumber-preprocessor");
        Given("a step", function() {
          return "pending";
        });
        """
      When I run cypress
      Then it passes
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ■ Given a step          # not available:0
      """

    Scenario: undefined step
      Given a file named "cypress/e2e/a.feature" with:
        """
        Feature: a feature name
          Scenario: a scenario name
            Given a step
        """
      And a file named "cypress/support/step_definitions/steps.js" with:
        """
        // empty
        """
      When I run cypress
      Then it fails
      And the output should contain
      """
        Feature: a feature name

          Scenario: a scenario name # cypress/e2e/a.feature:2
            ■ Given a step
      """

    Scenario: retried scenario
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
      And the output should contain
      """
        Feature: a feature

          Scenario: a scenario # cypress/e2e/a.feature:2
            ✘ Given a step     # not available:0
                  some error

          Scenario: a scenario # cypress/e2e/a.feature:2
            ✔ Given a step     # not available:0
      """

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
      And the output should contain
      """
        Feature: a feature

          @skip
          Scenario: first scenario # cypress/e2e/a.feature:3
            ↷ Given a step         # not available:0

          Scenario: second scenario # cypress/e2e/a.feature:5
            ✔ Given a step          # not available:0

          Scenario: third scenario # cypress/e2e/a.feature:7
            ✔ Given a step         # not available:0
      """

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
      And the output should contain
      """
        Feature: a feature

          Scenario: first scenario # cypress/e2e/a.feature:2
            ✔ Given a step         # not available:0

          @skip
          Scenario: second scenario # cypress/e2e/a.feature:5
            ↷ Given a step          # not available:0

          Scenario: third scenario # cypress/e2e/a.feature:7
            ✔ Given a step         # not available:0
      """

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
      And the output should contain
      """
        Feature: a feature

          Scenario: first scenario # cypress/e2e/a.feature:2
            ✔ Given a step         # not available:0

          Scenario: second scenario # cypress/e2e/a.feature:4
            ✔ Given a step          # not available:0

          @skip
          Scenario: third scenario # cypress/e2e/a.feature:7
            ↷ Given a step         # not available:0
      """

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
      And the output should contain
      """
        Feature: a feature

          @skip
          Scenario: first scenario # cypress/e2e/a.feature:3
            ↷ Given a step         # not available:0

          @skip
          Scenario: second scenario # cypress/e2e/a.feature:6
            ↷ Given a step          # not available:0

          @skip
          Scenario: third scenario # cypress/e2e/a.feature:9
            ↷ Given a step         # not available:0
      """

  @network
  Rule: it should handle reloads gracefully in a multitude of scenarios

    Reloading occurs when visiting or configuring baseUrl to a new domain, either different from the
    preconfigured value or because no value was configured to begin with. This forces Cypress to
    reload the window, re-fire before:spec event and re-run the current test.

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
      And the output should contain
      """
        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3
            ✔ Given a step     # not available:0

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0
      """

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
      And the output should contain
      """
        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3

        Reloading..

        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3
            ✔ Given a step     # not available:0

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7

        Reloading..

        Feature: a feature

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0
      """

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
      And the output should not contain "Reloading.."

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
      And the output should contain
      """
        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3
            ✔ Given a step     # not available:0

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0

        Reloading..

        Feature: a feature

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0
      """

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
      And the output should not contain "Reloading.."

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
      And the output should contain
      """
        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3
            ✔ Given a step     # not available:0

        Reloading..

        Feature: a feature

          @env(origin="https://duckduckgo.com/")
          Scenario: a scenario # cypress/e2e/a.feature:3
            ✔ Given a step     # not available:0

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0

        Reloading..

        Feature: a feature

          @env(origin="https://google.com/")
          Scenario: another scenario # cypress/e2e/a.feature:7
            ✔ Given another step     # not available:0
      """
