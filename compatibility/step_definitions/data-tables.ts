import { When, Then, DataTable } from "@badeball/cypress-cucumber-preprocessor";

When("the following table is transposed:", function (table: DataTable) {
  this.transposed = table.transpose();
});

Then("it should be:", function (expected: DataTable) {
  expect(this.transposed.raw()).to.deep.equal(expected.raw());
});
