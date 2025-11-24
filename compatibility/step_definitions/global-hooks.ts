import {
  AfterAll,
  BeforeAll,
  When,
} from "@badeball/cypress-cucumber-preprocessor";

BeforeAll({}, function () {
  // no-op
});

BeforeAll({}, function () {
  // no-op
});

When("a step passes", function () {
  // no-op
});

When("a step fails", function () {
  throw new Error("Exception in step");
});

AfterAll({}, function () {
  // no-op
});

AfterAll({}, function () {
  // no-op
});
