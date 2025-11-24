import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

Given("there are {int} cucumbers", function (initialCount) {
  this.count = initialCount;
});

When("I eat {int} cucumbers", function (eatCount: number) {
  this.count -= eatCount;
});

Then("I should have {int} cucumbers", function (expectedCount: number) {
  expect(this.count).to.equal(expectedCount);
});
