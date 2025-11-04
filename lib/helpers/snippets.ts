import { GeneratedExpression } from "@cucumber/cucumber-expressions";
import * as messages from "@cucumber/messages";

const TEMPLATE = `
[function]("[definition]", function ([arguments]) {
  return "pending";
});
`.trim();

export function getFunctionName(type: messages.PickleStepType) {
  switch (type) {
    case messages.PickleStepType.CONTEXT:
      return "Given";
    case messages.PickleStepType.ACTION:
      return "When";
    case messages.PickleStepType.OUTCOME:
      return "Then";
    case messages.PickleStepType.UNKNOWN:
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
