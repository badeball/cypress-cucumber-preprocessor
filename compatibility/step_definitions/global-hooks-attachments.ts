import {
  AfterAll,
  attach,
  BeforeAll,
  When,
} from "@badeball/cypress-cucumber-preprocessor";

BeforeAll({}, function () {
  attach("Attachment from BeforeAll hook", "text/plain");
});

When("a step passes", function () {
  // no-op
});

AfterAll({}, function () {
  attach("Attachment from AfterAll hook", "text/plain");
});
