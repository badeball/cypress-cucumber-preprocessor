import { attach, When } from "@badeball/cypress-cucumber-preprocessor";

When("a JPEG image is attached", function () {
  cy.readFile("cucumber.jpeg", "base64").then((file) =>
    attach(file, "base64:image/jpeg"),
  );
});

When("a PNG image is attached", function () {
  cy.readFile("cucumber.png", "base64").then((file) =>
    attach(file, "base64:image/png"),
  );
});
