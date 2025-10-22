import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

Given("the customer has {int} cents", function (money) {
  this.money = money;
});

Given("there are chocolate bars in stock", function () {
  this.stock = ["Mars"];
});

Given("there are no chocolate bars in stock", function () {
  this.stock = [];
});

When(
  "the customer tries to buy a {int} cent chocolate bar",
  function (price: number) {
    if (this.money >= price) {
      this.chocolate = this.stock.pop();
    }
  },
);

Then("the sale should not happen", function () {
  expect(this.chocolate).to.equal(undefined);
});

Then("the sale should happen", function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  expect(this.chocolate).to.be.ok;
});
