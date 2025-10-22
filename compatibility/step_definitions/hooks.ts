import { After, Before, When } from "@badeball/cypress-cucumber-preprocessor";

Before({}, function () {
  // no-op
});

When("a step passes", function () {
  // no-op
});

When("a step fails", function () {
  throw new Error("Exception in step");
});

After({}, function () {
  // no-op
});
