import type * as messages from "@cucumber/messages";

import { ensure } from "./assertions";

export function* traverseGherkinDocument(
  gherkinDocument: messages.GherkinDocument,
) {
  yield gherkinDocument;

  if (gherkinDocument.feature) {
    yield* traverseFeature(gherkinDocument.feature);
  }
}

function* traverseFeature(feature: messages.Feature) {
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

function* traverseFeatureChild(featureChild: messages.FeatureChild) {
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

function* traverseFeatureRule(rule: messages.Rule) {
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

function* traverseRuleChild(ruleChild: messages.RuleChild) {
  yield ruleChild;

  if (ruleChild.background) {
    yield* traverseBackground(ruleChild.background);
  }

  if (ruleChild.scenario) {
    yield* traverseScenario(ruleChild.scenario);
  }
}

function* traverseBackground(backgorund: messages.Background) {
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

function* traverseScenario(scenario: messages.Scenario) {
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

function* traverseStep(step: messages.Step) {
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

function* traverseDocString(docString: messages.DocString) {
  yield docString;

  if (docString.location) {
    yield docString.location;
  }
}

function* traverseDataTable(dataTable: messages.DataTable) {
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

function* traverseRow(row: messages.TableRow) {
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

function* traverseCell(cell: messages.TableCell) {
  yield cell;

  if (cell.location) {
    yield cell.location;
  }
}

function* traverseExample(example: messages.Examples) {
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
