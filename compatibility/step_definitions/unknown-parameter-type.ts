import { Given } from "@badeball/cypress-cucumber-preprocessor";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given("{airport} is closed because of a strike", function (airport) {
  throw new Error(
    "Should not be called because airport parameter type has not been defined",
  );
});
