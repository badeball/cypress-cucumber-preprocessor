import {
  Before,
  When,
  After,
  attach,
} from "@badeball/cypress-cucumber-preprocessor";

Before(function () {
  cy.readFile("cucumber.svg", "base64").then((file) =>
    attach(file, "base64:image/svg+xml"),
  );
});

When("a step passes", function () {
  // no-op
});

After(function () {
  cy.readFile("cucumber.svg", "base64").then((file) =>
    attach(file, "base64:image/svg+xml"),
  );
});
