const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");

When("I visit duckduckgo.com", () => {
  cy.visit("https://duckduckgo.com/");
});

Then("I should see a search bar", () => {
  cy.get("textarea")
    .should("have.attr", "placeholder")
    .and("match", /Search without being tracked|Search privately/);
});
