import { GeneratedExpression } from "@cucumber/cucumber-expressions";
import type * as messages from "@cucumber/messages";

import { PickleStepType } from "./messages-enums";

const TEMPLATE = `
[function]("[definition]", function ([arguments]) {
  return "pending";
});
`.trim();

export function getFunctionName(type: messages.PickleStepType) {
  switch (type) {
    case PickleStepType.CONTEXT:
      return "Given";
    case PickleStepType.ACTION:
      return "When";
    case PickleStepType.OUTCOME:
      return "Then";
    case PickleStepType.UNKNOWN:
      return "Given";
    default:
      throw "Unknown PickleStepType: " + type;
  }
}

export function generateSnippet(
  expression: GeneratedExpression,
  type: messages.PickleStepType,
  parameter: "dataTable" | "docString" | null,
) {
  const definition = expression.source
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  const stepParameterNames = parameter ? [parameter] : [];

  const args = expression.parameterNames.concat(stepParameterNames).join(", ");

  return TEMPLATE.replace("[function]", getFunctionName(type))
    .replace("[definition]", definition)
    .replace("[arguments]", args);
}
