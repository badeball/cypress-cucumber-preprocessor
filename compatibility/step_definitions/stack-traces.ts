import { When } from "@badeball/cypress-cucumber-preprocessor";

When("a step throws an exception", function () {
  throw new Error("BOOM");
});
