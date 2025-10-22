import assert from "node:assert";

import * as messages from "@cucumber/messages";

import {
  CucumberExpressionGenerator,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";

import { stripIndent } from "./strings";

import { generateSnippet } from "./snippets";

function example(options: {
  description: string;
  type: messages.PickleStepType;
  pattern: string;
  parameter?: "dataTable" | "docString";
  expected: string;
}) {
  context(options.description, () => {
    it("returns the proper snippet", () => {
      const snippets = new CucumberExpressionGenerator(
        () => new ParameterTypeRegistry().parameterTypes,
      ).generateExpressions(options.pattern);

      const actual = generateSnippet(
        snippets[0],
        options.type,
        options.parameter ?? null,
      );

      assert.strictEqual(actual, options.expected);
    });
  });
}

describe("generateSnippet()", () => {
  example({
    description: "simplest pattern",
    type: messages.PickleStepType.CONTEXT,
    pattern: "a step",
    expected: stripIndent(`
      Given("a step", function () {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "with docstring",
    parameter: "docString",
    type: messages.PickleStepType.CONTEXT,
    pattern: "a step",
    expected: stripIndent(`
      Given("a step", function (docString) {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "with datatable",
    parameter: "dataTable",
    type: messages.PickleStepType.CONTEXT,
    pattern: "a step",
    expected: stripIndent(`
      Given("a step", function (dataTable) {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "string argument",
    pattern: 'a "step"',
    type: messages.PickleStepType.CONTEXT,
    expected: stripIndent(`
      Given("a {string}", function (string) {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "number argument",
    pattern: "1 step",
    type: messages.PickleStepType.CONTEXT,
    expected: stripIndent(`
      Given("{int} step", function (int) {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "action",
    type: messages.PickleStepType.ACTION,
    pattern: "a step",
    expected: stripIndent(`
      When("a step", function () {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "outcome",
    type: messages.PickleStepType.OUTCOME,
    pattern: "a step",
    expected: stripIndent(`
      Then("a step", function () {
        return "pending";
      });
    `).trim(),
  });

  example({
    description: "unknown",
    type: messages.PickleStepType.UNKNOWN,
    pattern: "a step",
    expected: stripIndent(`
      Given("a step", function () {
        return "pending";
      });
    `).trim(),
  });
});
