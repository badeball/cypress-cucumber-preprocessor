import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given(
  /^a (.*?)(?: and a (.*?))?(?: and a (.*?))?$/,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function (vegtable1: string, vegtable2: string, vegtable3: string) {
    // no-op
  },
);
