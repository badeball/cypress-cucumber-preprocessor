import type * as messages from "@cucumber/messages";

import { ensure } from "./assertions";

export function* traverseGherkinDocument(
  gherkinDocument: messages.GherkinDocument,
): Generator<
  | messages.GherkinDocument
  | messages.Feature
  | messages.Location
  | messages.Tag
  | messages.FeatureChild
  | messages.Rule
  | messages.Background
  | messages.Scenario
  | messages.RuleChild
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield gherkinDocument;

  if (gherkinDocument.feature) {
    yield* traverseFeature(gherkinDocument.feature);
  }
}

function* traverseFeature(
  feature: messages.Feature,
): Generator<
  | messages.Feature
  | messages.Location
  | messages.Tag
  | messages.FeatureChild
  | messages.Rule
  | messages.Background
  | messages.Scenario
  | messages.RuleChild
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield feature;

  if (feature.location) {
    yield feature.location;
  }

  if (feature.tags) {
    for (const tag of feature.tags) {
      yield tag;
    }
  }

  if (feature.children) {
    for (const child of feature.children) {
      yield* traverseFeatureChild(child);
    }
  }
}

function* traverseFeatureChild(
  featureChild: messages.FeatureChild,
): Generator<
  | messages.Location
  | messages.FeatureChild
  | messages.Rule
  | messages.Background
  | messages.Scenario
  | messages.RuleChild
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield featureChild;

  if (featureChild.rule) {
    yield* traverseFeatureRule(featureChild.rule);
  }

  if (featureChild.background) {
    yield* traverseBackground(featureChild.background);
  }

  if (featureChild.scenario) {
    yield* traverseScenario(featureChild.scenario);
  }
}

function* traverseFeatureRule(
  rule: messages.Rule,
): Generator<
  | messages.Location
  | messages.Rule
  | messages.Background
  | messages.Scenario
  | messages.RuleChild
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield rule;

  if (rule.location) {
    yield rule.location;
  }

  if (rule.children) {
    for (const child of rule.children) {
      yield* traverseRuleChild(child);
    }
  }
}

function* traverseRuleChild(
  ruleChild: messages.RuleChild,
): Generator<
  | messages.Location
  | messages.Background
  | messages.Scenario
  | messages.RuleChild
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield ruleChild;

  if (ruleChild.background) {
    yield* traverseBackground(ruleChild.background);
  }

  if (ruleChild.scenario) {
    yield* traverseScenario(ruleChild.scenario);
  }
}

function* traverseBackground(
  backgorund: messages.Background,
): Generator<
  | messages.Location
  | messages.Background
  | messages.Step
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield backgorund;

  if (backgorund.location) {
    yield backgorund.location;
  }

  if (backgorund.steps) {
    for (const step of backgorund.steps) {
      yield* traverseStep(step);
    }
  }
}

function* traverseScenario(
  scenario: messages.Scenario,
): Generator<
  | messages.Scenario
  | messages.Location
  | messages.Step
  | messages.Examples
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield scenario;

  if (scenario.location) {
    yield scenario.location;
  }

  if (scenario.steps) {
    for (const step of scenario.steps) {
      yield* traverseStep(step);
    }
  }

  if (scenario.examples) {
    for (const example of scenario.examples) {
      yield* traverseExample(example);
    }
  }
}

function* traverseStep(
  step: messages.Step,
): Generator<
  | messages.Location
  | messages.Step
  | messages.DocString
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield step;

  if (step.location) {
    yield step.location;
  }

  if (step.docString) {
    yield* traverseDocString(step.docString);
  }

  if (step.dataTable) {
    yield* traverseDataTable(step.dataTable);
  }
}

function* traverseDocString(
  docString: messages.DocString,
): Generator<messages.Location | messages.DocString, void, unknown> {
  yield docString;

  if (docString.location) {
    yield docString.location;
  }
}

function* traverseDataTable(
  dataTable: messages.DataTable,
): Generator<
  | messages.Location
  | messages.DataTable
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield dataTable;

  if (dataTable.location) {
    yield dataTable.location;
  }

  if (dataTable.rows) {
    for (const row of dataTable.rows) {
      yield* traverseRow(row);
    }
  }
}

function* traverseRow(
  row: messages.TableRow,
): Generator<
  messages.Location | messages.TableRow | messages.TableCell,
  void,
  unknown
> {
  yield row;

  if (row.location) {
    yield row.location;
  }

  if (row.cells) {
    for (const cell of row.cells) {
      yield* traverseCell(cell);
    }
  }
}

function* traverseCell(
  cell: messages.TableCell,
): Generator<messages.Location | messages.TableCell, void, unknown> {
  yield cell;

  if (cell.location) {
    yield cell.location;
  }
}

function* traverseExample(
  example: messages.Examples,
): Generator<
  | messages.Location
  | messages.Examples
  | messages.TableRow
  | messages.TableCell,
  void,
  unknown
> {
  yield example;

  if (example.location) {
    yield example.location;
  }

  if (example.tableHeader) {
    yield* traverseRow(example.tableHeader);
  }

  if (example.tableBody) {
    for (const row of example.tableBody) {
      yield* traverseRow(row);
    }
  }
}

export function collectTagNames(
  tags: readonly (messages.Tag | messages.PickleTag)[] | null | undefined,
) {
  return (
    tags?.map((tag) => ensure(tag.name, "Expected tag to have a name")) ?? []
  );
}

export type YieldType<T extends Generator> =
  T extends Generator<infer R> ? R : never;

export function createAstIdMap(
  gherkinDocument: messages.GherkinDocument,
): Map<string, YieldType<ReturnType<typeof traverseGherkinDocument>>> {
  const astIdMap = new Map<
    string,
    YieldType<ReturnType<typeof traverseGherkinDocument>>
  >();

  for (const node of traverseGherkinDocument(gherkinDocument)) {
    if ("id" in node && node.id) {
      astIdMap.set(node.id, node);
    }
  }

  return astIdMap;
}
