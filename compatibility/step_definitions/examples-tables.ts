import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

Given("there are {int} cucumbers", function (initialCount: number) {
  this.count = initialCount;
});

Given("there are {int} friends", function (initialFriends: number) {
  this.friends = initialFriends;
});

When("I eat {int} cucumbers", function (eatCount: number) {
  this.count -= eatCount;
});

Then("I should have {int} cucumbers", function (expectedCount: number) {
  expect(this.count).to.equal(expectedCount);
});

Then("each person can eat {int} cucumbers", function (expectedShare: number) {
  const share = Math.floor(this.count / (1 + this.friends));
  expect(share).to.equal(expectedShare);
});
