import type * as messages from "@cucumber/messages";

import parse from "@cucumber/tag-expressions";

import {
  CucumberExpressionGenerator,
  Group,
  ParameterTypeRegistry,
  RegularExpression,
} from "@cucumber/cucumber-expressions";

import { v4 as uuid } from "uuid";

import random from "seedrandom";

import {
  assert,
  CypressCucumberAssertionError,
  ensure,
  fail,
} from "./helpers/assertions";

import DataTable from "./data_table";

import {
  assignRegistry,
  freeRegistry,
  ICaseHook,
  MissingDefinitionError,
  Registry,
} from "./registry";

import {
  collectTagNames,
  createAstIdMap,
  traverseGherkinDocument,
} from "./helpers/ast";

import {
  HOOK_FAILURE_EXPR,
  INTERNAL_SPEC_PROPERTIES,
  INTERNAL_SUITE_PROPERTIES,
} from "./constants";

import {
  ITaskFrontendTrackingError,
  ITaskSpecEnvelopes,
  ITaskTestCaseFinished,
  ITaskTestCaseStarted,
  ITaskTestStepFinished,
  ITaskTestStepStarted,
  TASK_FRONTEND_TRACKING_ERROR,
  TASK_SPEC_ENVELOPES,
  TASK_TEST_CASE_FINISHED,
  TASK_TEST_CASE_STARTED,
  TASK_TEST_STEP_FINISHED,
  TASK_TEST_STEP_STARTED,
} from "./cypress-task-definitions";

import { notNull } from "./helpers/type-guards";

import { looksLikeOptions, tagToCypressOptions } from "./helpers/tag-parser";

import { createTimestamp, duration, StrictTimestamp } from "./helpers/messages";

import { indent, stripIndent } from "./helpers/strings";

import { generateSnippet } from "./helpers/snippets";

import { runStepWithLogGroup } from "./helpers/cypress";

import { getTags } from "./helpers/environment";

import { ICaseHookParameter, IStepHookParameter } from "./public-member-types";

import {
  isExclusivelySuiteConfiguration,
  isNotExclusivelySuiteConfiguration,
  tagsToOptions,
} from "./helpers/options";
import { Position } from "./helpers/source-map";

import {
  HookType,
  SourceMediaType,
  StepDefinitionPatternType,
  TestStepResultStatus,
} from "./helpers/messages-enums";

type Node = ReturnType<typeof parse>;

type TestStepIds = Map<string, Map<string, string>>;

interface CompositionContext {
  registry: Registry<Mocha.Context, unknown[]>;
  newId: messages.IdGenerator.NewId;
  gherkinDocument: messages.GherkinDocument;
  astIdsMap: ReturnType<typeof createAstIdMap>;
  testStepIds: TestStepIds;
  pickles: messages.Pickle[];
  includedPickles: (messages.Pickle & { willBekipped: boolean })[];
  specEnvelopes: messages.Envelope[];
  testFilter: Node;
  omitFiltered: boolean;
  isTrackingState: boolean;
  softErrors: boolean;
  stepDefinitionHints: {
    stepDefinitions: string | string[];
    stepDefinitionPatterns: string[];
    stepDefinitionPaths: string[];
  };
  dryRun: boolean;
}

function getSourceReferenceFromPosition(
  position?: Position,
): messages.SourceReference {
  if (position) {
    return {
      uri: position.source,
      location: { line: position.line, column: position.column },
    };
  } else {
    return {
      uri: "not available",
      location: { line: 0, column: 0 },
    };
  }
}

interface IStep {
  hook?: ICaseHook<Mocha.Context>;
  pickleStep?: messages.PickleStep;
}

const internalPropertiesReplacementText =
  "Internal properties of cypress-cucumber-preprocessor omitted from report.";

const noopFn = () => {};

export interface InternalSpecProperties {
  pickle: messages.Pickle;
  testCaseStartedId: string;
  currentStepStartedAt?: StrictTimestamp;
  currentStep?: IStep;
  allSteps: IStep[];
  remainingSteps: IStep[];
  toJSON(): typeof internalPropertiesReplacementText;
}

export interface InternalSuiteProperties {
  isEventHandlersAttached?: boolean;
}

export function retrieveInternalSpecProperties(): InternalSpecProperties {
  return Cypress.env(INTERNAL_SPEC_PROPERTIES) as InternalSpecProperties;
}

function updateInternalSpecProperties(
  newProperties: Partial<InternalSpecProperties>,
): void {
  Object.assign(retrieveInternalSpecProperties(), newProperties);
}

function retrieveInternalSuiteProperties():
  | InternalSuiteProperties
  | undefined {
  return Cypress.env(INTERNAL_SUITE_PROPERTIES);
}

function taskSpecEnvelopes(context: CompositionContext) {
  if (context.isTrackingState) {
    cy.task(
      TASK_SPEC_ENVELOPES,
      { messages: context.specEnvelopes } satisfies ITaskSpecEnvelopes,
      {
        log: false,
      },
    );
  }
}

function taskTestCaseStarted(
  context: CompositionContext,
  testCaseStarted: messages.TestCaseStarted,
) {
  if (context.isTrackingState) {
    cy.task(
      TASK_TEST_CASE_STARTED,
      testCaseStarted satisfies ITaskTestCaseStarted,
      {
        log: false,
      },
    );
  }
}

function taskTestCaseFinished(
  context: CompositionContext,
  testCasefinished: messages.TestCaseFinished,
) {
  if (context.isTrackingState) {
    cy.task(
      TASK_TEST_CASE_FINISHED,
      testCasefinished satisfies ITaskTestCaseFinished,
      {
        log: false,
      },
    );
  }
}

function taskTestStepStarted(
  context: CompositionContext,
  testStepStarted: messages.TestStepStarted,
) {
  if (context.isTrackingState) {
    cy.task(
      TASK_TEST_STEP_STARTED,
      testStepStarted satisfies ITaskTestStepStarted,
      {
        log: false,
      },
    );
  }
}

function taskTestStepFinished(
  context: CompositionContext,
  testStepfinished: messages.TestStepFinished,
) {
  if (context.isTrackingState) {
    cy.task(
      TASK_TEST_STEP_FINISHED,
      testStepfinished satisfies ITaskTestStepFinished,
      {
        log: false,
      },
    );
  }
}

function taskFrontEndTrackingError(error: CypressCucumberAssertionError) {
  cy.task(
    TASK_FRONTEND_TRACKING_ERROR,
    (error.stack ?? error.message) satisfies ITaskFrontendTrackingError,
    {
      log: true,
    },
  );
}

function emitSkippedPickle(
  context: CompositionContext,
  pickle: messages.Pickle,
) {
  const { registry } = context;

  const testCaseId = pickle.id;
  const pickleSteps = pickle.steps ?? [];
  const tags = collectTagNames(pickle.tags);
  const beforeHooks = registry.resolveBeforeHooks(tags);
  const afterHooks = registry.resolveAfterHooks(tags);
  const testCaseStartedId = context.newId();
  const timestamp = createTimestamp();

  const steps: (ICaseHook<Mocha.Context> | messages.PickleStep)[] = [
    ...beforeHooks,
    ...pickleSteps,
    ...afterHooks,
  ];

  taskTestCaseStarted(context, {
    id: testCaseStartedId,
    testCaseId,
    attempt: 0,
    timestamp,
  });

  for (const step of steps) {
    const testStepId = getTestStepId({
      context,
      pickleId: pickle.id,
      hookIdOrPickleStepId: step.id,
    });

    taskTestStepStarted(context, {
      testStepId,
      testCaseStartedId,
      timestamp,
    });

    taskTestStepFinished(context, {
      testStepId,
      testCaseStartedId,
      testStepResult: {
        status: TestStepResultStatus.SKIPPED,
        duration: {
          seconds: 0,
          nanos: 0,
        },
      },
      timestamp,
    });
  }
  taskTestCaseFinished(context, {
    testCaseStartedId,
    timestamp,
    willBeRetried: false,
  });
}

function findPickleById(context: CompositionContext, astId: string) {
  return ensure(
    context.pickles.find(
      (pickle) => pickle.astNodeIds && pickle.astNodeIds.includes(astId),
    ),
    `Expected to find a pickle associated with id = ${astId}`,
  );
}

function collectExampleIds(examples: readonly messages.Examples[]) {
  return examples
    .map((examples) => {
      return ensure(examples.tableBody, "Expected to find a table body").map(
        (row) => ensure(row.id, "Expected table row to have an id"),
      );
    })
    .reduce((acum, el) => acum.concat(el), []);
}

function createTestStepId(options: {
  testStepIds: TestStepIds;
  newId: messages.IdGenerator.NewId;
  pickleId: string;
  hookIdOrPickleStepId: string;
}) {
  const { testStepIds, newId, pickleId, hookIdOrPickleStepId } = options;

  const testStepId = newId();

  let pickleStepIds: Map<string, string>;

  if (testStepIds.has(pickleId)) {
    // See https://github.com/microsoft/TypeScript/issues/9619.
    pickleStepIds = testStepIds.get(pickleId)!;
  } else {
    pickleStepIds = new Map();
    testStepIds.set(pickleId, pickleStepIds);
  }

  pickleStepIds.set(hookIdOrPickleStepId, testStepId);

  return testStepId;
}

function getTestStepId(options: {
  context: CompositionContext;
  pickleId: string;
  hookIdOrPickleStepId: string;
}) {
  const { context, pickleId, hookIdOrPickleStepId } = options;

  return ensure(
    ensure(
      context.testStepIds.get(pickleId),
      "Expected to find test step IDs for pickle = " + pickleId,
    ).get(hookIdOrPickleStepId),
    "Expected to find test step ID for hook or pickleStep = " +
      hookIdOrPickleStepId,
  );
}

function createStepDescription({
  name,
  tags,
}: {
  name?: string;
  tags?: string;
}): string | undefined {
  if (name == null && tags == null) {
    return;
  } else if (name == null) {
    return tags;
  } else if (tags == null) {
    return name;
  } else {
    return `${name} (${tags})`;
  }
}

function createFeature(context: CompositionContext, feature: messages.Feature) {
  const suiteOptions = Object.fromEntries(
    tagsToOptions(feature.tags).filter(isExclusivelySuiteConfiguration),
  ) as Cypress.TestConfigOverrides;

  const mochaGlobals =
    globalThis["__cypress_cucumber_preprocessor_mocha_dont_use_this"] ??
    globalThis;

  describe(feature.name || "<unamed feature>", suiteOptions, () => {
    mochaGlobals.before(function () {
      beforeHandler.call(this, context);
    });

    mochaGlobals.beforeEach(function () {
      beforeEachHandler.call(this, context);
    });

    mochaGlobals.after(function () {
      afterHandler.call(this, context);
    });

    mochaGlobals.afterEach(function () {
      afterEachHandler.call(this, context);
    });

    if (feature.children) {
      for (const child of feature.children) {
        if (child.scenario) {
          createScenario(context, child.scenario);
        } else if (child.rule) {
          createRule(context, child.rule);
        }
      }
    }
  });
}

function createRule(context: CompositionContext, rule: messages.Rule) {
  const picklesWithinRule = rule.children
    ?.map((child) => child.scenario)
    .filter(notNull)
    .flatMap((scenario) => {
      if (scenario.examples.length > 0) {
        return collectExampleIds(scenario.examples).map((exampleId) => {
          return findPickleById(context, exampleId);
        });
      } else {
        const scenarioId = ensure(
          scenario.id,
          "Expected scenario to have an id",
        );

        return findPickleById(context, scenarioId);
      }
    });

  if (picklesWithinRule) {
    if (context.omitFiltered) {
      const matches = picklesWithinRule.filter((pickle) =>
        context.testFilter.evaluate(collectTagNames(pickle.tags)),
      );

      if (matches.length === 0) {
        return;
      }
    }
  }

  const suiteOptions = Object.fromEntries(
    tagsToOptions(rule.tags).filter(isExclusivelySuiteConfiguration),
  ) as Cypress.TestConfigOverrides;

  describe(rule.name || "<unamed rule>", suiteOptions, () => {
    if (rule.children) {
      for (const child of rule.children) {
        if (child.scenario) {
          createScenario(context, child.scenario);
        }
      }
    }
  });
}
function createScenario(
  context: CompositionContext,
  scenario: messages.Scenario,
) {
  if (scenario.examples.length > 0) {
    const exampleIds = collectExampleIds(scenario.examples);

    for (let i = 0; i < exampleIds.length; i++) {
      const exampleId = exampleIds[i];
      const pickle = findPickleById(context, exampleId);
      const baseName = pickle.name || "<unamed scenario>";
      const exampleName = `${baseName} (example #${i + 1})`;

      createPickle(context, { ...pickle, name: exampleName });
    }
  } else {
    const scenarioId = ensure(scenario.id, "Expected scenario to have an id");

    const pickle = findPickleById(context, scenarioId);

    createPickle(context, pickle);
  }
}

function createPickle(context: CompositionContext, pickle: messages.Pickle) {
  const { registry, gherkinDocument, pickles, testFilter, dryRun } = context;
  const testCaseId = pickle.id;
  const pickleSteps = pickle.steps ?? [];
  const scenarioName = pickle.name || "<unamed scenario>";
  const tags = collectTagNames(pickle.tags);
  const beforeHooks = registry.resolveBeforeHooks(tags);
  const afterHooks = registry.resolveAfterHooks(tags);

  const steps: IStep[] = [
    ...beforeHooks.map((hook) => ({ hook })),
    ...pickleSteps.map((pickleStep) => ({ pickleStep })),
    ...afterHooks.map((hook) => ({ hook })),
  ];

  if (shouldSkipPickle(testFilter, pickle)) {
    if (!context.omitFiltered) {
      it.skip(scenarioName);
    }

    return;
  }

  let attempt = 0;

  const internalProperties: InternalSpecProperties = {
    pickle,
    testCaseStartedId: context.newId(),
    allSteps: steps,
    remainingSteps: [...steps],
    toJSON: () => internalPropertiesReplacementText,
  };

  const internalEnv = {
    [INTERNAL_SPEC_PROPERTIES]: internalProperties,
  };

  const scenario = ensure(
    context.astIdsMap.get(
      ensure(pickle.astNodeIds?.[0], "Expected to find at least one astNodeId"),
    ),
    `Expected to find scenario associated with id = ${pickle.astNodeIds?.[0]}`,
  );

  assert("tags" in scenario, "Expected a scenario to have a tags property");

  assert(
    "examples" in scenario,
    "Expected a scenario to have a examples property",
  );

  const testSpecificOptions = tagsToOptions([
    ...scenario.tags,
    ...scenario.examples.flatMap((example) => example.tags),
  ]);

  for (const entry of testSpecificOptions) {
    if (isExclusivelySuiteConfiguration(entry)) {
      throw new Error(
        `The \`${entry[0]}\` configuration can only be overridden from a suite-level override (in Cucumber-terms this means on a Feature or Rule).`,
      );
    }
  }

  const inheritedTestOptions = Object.fromEntries(
    tags
      .filter(looksLikeOptions)
      .map(tagToCypressOptions)
      .filter(isNotExclusivelySuiteConfiguration),
  ) as Cypress.TestConfigOverrides;

  if (inheritedTestOptions.env) {
    Object.assign(inheritedTestOptions.env, internalEnv);
  } else {
    inheritedTestOptions.env = internalEnv;
  }

  it(scenarioName, inheritedTestOptions, function () {
    /**
     * This must always be true, otherwise something is off.
     */
    assert(
      context.includedPickles[0].id === pickle.id,
      "Included pickle stack is unsynchronized",
    );

    const { remainingSteps, testCaseStartedId } =
      retrieveInternalSpecProperties();

    taskTestCaseStarted(context, {
      id: testCaseStartedId,
      testCaseId,
      attempt: attempt++,
      timestamp: createTimestamp(),
    });

    window.testState = {
      gherkinDocument,
      pickles,
      pickle,
    };

    const onAfterStep = (options: {
      testStepId: string;
      start: messages.Timestamp;
      result: any;
    }) => {
      const { testStepId, start, result } = options;

      const end = createTimestamp();

      if (result === "pending" || result === "skipped") {
        if (result === "pending") {
          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.PENDING,
              duration: duration(start, end),
            },
            timestamp: end,
          });
        } else {
          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.SKIPPED,
              duration: duration(start, end),
            },
            timestamp: end,
          });
        }

        remainingSteps.shift();

        for (const skippedStep of remainingSteps) {
          const hookIdOrPickleStepId = ensure(
            skippedStep.hook?.id ?? skippedStep.pickleStep?.id,
            "Expected a step to either be a hook or a pickleStep",
          );

          const testStepId = getTestStepId({
            context,
            pickleId: pickle.id,
            hookIdOrPickleStepId,
          });

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: createTimestamp(),
          });

          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.SKIPPED,
              duration: {
                seconds: 0,
                nanos: 0,
              },
            },
            timestamp: createTimestamp(),
          });
        }

        for (let i = 0, count = remainingSteps.length; i < count; i++) {
          remainingSteps.pop();
        }

        cy.then(() => this.skip());
      } else {
        taskTestStepFinished(context, {
          testStepId,
          testCaseStartedId,
          testStepResult: {
            status: TestStepResultStatus.PASSED,
            duration: duration(start, end),
          },
          timestamp: end,
        });

        remainingSteps.shift();
      }
    };

    for (const step of steps) {
      if (step.hook) {
        const hook = step.hook;

        const testStepId = getTestStepId({
          context,
          pickleId: pickle.id,
          hookIdOrPickleStepId: hook.id,
        });

        cy.then(() => {
          delete window.testState.pickleStep;

          const start = createTimestamp();

          internalProperties.currentStepStartedAt = start;

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: start,
          });

          return cy.wrap(start, { log: false });
        })
          .then((start) => {
            const options: ICaseHookParameter = {
              pickle,
              gherkinDocument,
              testCaseStartedId,
            };

            return runStepWithLogGroup({
              fn: dryRun
                ? noopFn
                : () => registry.runCaseHook(this, hook, options),
              keyword: hook.keyword,
              text: createStepDescription(hook),
            }).then((result) => {
              return { start, result };
            });
          })
          .then(({ start, result }) =>
            onAfterStep({ start, result, testStepId }),
          );
      } else if (step.pickleStep) {
        const pickleStep = step.pickleStep;

        const testStepId = getTestStepId({
          context,
          pickleId: pickle.id,
          hookIdOrPickleStepId: pickleStep.id,
        });

        const text = ensure(
          pickleStep.text,
          "Expected pickle step to have a text",
        );

        const scenarioStep = ensure(
          context.astIdsMap.get(
            ensure(
              pickleStep.astNodeIds?.[0],
              "Expected to find at least one astNodeId",
            ),
          ),
          `Expected to find scenario step associated with id = ${pickleStep.astNodeIds?.[0]}`,
        );

        const argument: DataTable | string | undefined = pickleStep.argument
          ?.dataTable
          ? new DataTable(pickleStep.argument.dataTable)
          : pickleStep.argument?.docString?.content
            ? pickleStep.argument.docString.content
            : undefined;

        cy.then(() => {
          window.testState.pickleStep = step.pickleStep;

          const start = createTimestamp();

          internalProperties.currentStep = { pickleStep };
          internalProperties.currentStepStartedAt = start;

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: start,
          });

          return cy.wrap(start, { log: false });
        })
          .then((start) => {
            const beforeStepHooks = registry.resolveBeforeStepHooks(tags);
            const afterStepHooks = registry.resolveAfterStepHooks(tags);
            const options: IStepHookParameter = {
              pickle,
              pickleStep,
              gherkinDocument,
              testCaseStartedId,
              testStepId,
            };

            const beforeHooksChain = beforeStepHooks.reduce(
              (chain, beforeStepHook) => {
                return chain.then(() =>
                  runStepWithLogGroup({
                    keyword: "BeforeStep",
                    text: createStepDescription(beforeStepHook),
                    fn: dryRun
                      ? noopFn
                      : () =>
                          registry.runStepHook(this, beforeStepHook, options),
                  }),
                );
              },
              cy.wrap({} as unknown, { log: false }),
            );

            return beforeHooksChain.then(() => {
              try {
                return runStepWithLogGroup({
                  keyword: ensure(
                    "keyword" in scenarioStep && scenarioStep.keyword,
                    "Expected to find a keyword in the scenario step",
                  ),
                  argument,
                  text,
                  fn: () =>
                    registry.runStepDefinition(this, text, dryRun, argument),
                }).then((result) => {
                  return afterStepHooks
                    .reduce(
                      (chain, afterStepHook) => {
                        return chain.then(() =>
                          runStepWithLogGroup({
                            keyword: "AfterStep",
                            text: createStepDescription(afterStepHook),
                            fn: dryRun
                              ? noopFn
                              : () =>
                                  registry.runStepHook(
                                    this,
                                    afterStepHook,
                                    options,
                                  ),
                          }),
                        );
                      },
                      cy.wrap({} as unknown, { log: false }),
                    )
                    .then(() => {
                      return { start, result };
                    });
                });
              } catch (e) {
                if (e instanceof MissingDefinitionError) {
                  throw new Error(
                    createMissingStepDefinitionMessage(
                      context,
                      pickleStep,
                      context.registry.parameterTypeRegistry,
                    ),
                  );
                } else {
                  throw e;
                }
              }
            });
          })
          .then(({ start, result }) =>
            onAfterStep({ start, result, testStepId }),
          );
      }
    }
  });
}

function collectTagNamesFromGherkinDocument(
  gherkinDocument: messages.GherkinDocument,
) {
  const tagNames: string[] = [];

  for (const node of traverseGherkinDocument(gherkinDocument)) {
    if ("tags" in node) {
      tagNames.push(...collectTagNames(node.tags));
    }
  }

  return tagNames;
}

function createTestFilter(
  gherkinDocument: messages.GherkinDocument,
  environment: Cypress.ObjectLike,
): Node {
  const tagsInDocument = collectTagNamesFromGherkinDocument(gherkinDocument);

  if (tagsInDocument.includes("@only") || tagsInDocument.includes("@focus")) {
    return parse("@only or @focus");
  } else {
    const tags = getTags(environment);

    return tags ? parse(tags) : { evaluate: () => true };
  }
}

function shouldSkipPickle(testFilter: Node, pickle: messages.Pickle) {
  const tags = collectTagNames(pickle.tags);

  return !testFilter.evaluate(tags) || tags.includes("@skip");
}

function beforeHandler(this: Mocha.Context, context: CompositionContext) {
  if (!retrieveInternalSuiteProperties()?.isEventHandlersAttached) {
    fail(
      "Missing preprocessor event handlers (this usually means you've not invoked `addCucumberPreprocessorPlugin()` or not returned the config object in `setupNodeEvents()`)",
    );
  }

  const { registry } = context;

  registry.resolveBeforeAllHooks().reduce(
    (chain, hook) => {
      return chain.then(() =>
        runStepWithLogGroup({
          fn: context.dryRun ? noopFn : () => registry.runRunHook(this, hook),
          keyword: "BeforeAll",
        }),
      );
    },
    cy.wrap({} as unknown, { log: false }),
  );

  taskSpecEnvelopes(context);

  while (
    context.includedPickles.length > 0 &&
    context.includedPickles[0].willBekipped
  ) {
    emitSkippedPickle(context, context.includedPickles.shift()!);
  }
}

function beforeEachHandler(context: CompositionContext) {
  assignRegistry(context.registry);
}

function afterEachHandler(this: Mocha.Context, context: CompositionContext) {
  freeRegistry();

  const properties = retrieveInternalSpecProperties();

  const { pickle, testCaseStartedId, currentStepStartedAt, remainingSteps } =
    properties;

  const endTimestamp = createTimestamp();

  if (remainingSteps.length > 0) {
    try {
      if (this.currentTest?.state === "failed") {
        const error = ensure(
          this.currentTest?.err,
          "Expected to find an error",
        );

        const message = ensure(
          error.message,
          "Expected to find an error message",
        );

        if (HOOK_FAILURE_EXPR.test(message)) {
          return;
        }

        const failedStep = ensure(
          remainingSteps.shift(),
          "Expected there to be a remaining step",
        );

        const hookIdOrPickleStepId = ensure(
          failedStep.hook?.id ?? failedStep.pickleStep?.id,
          "Expected a step to either be a hook or a pickleStep",
        );

        const testStepId = getTestStepId({
          context,
          pickleId: pickle.id,
          hookIdOrPickleStepId,
        });

        const wasUndefinedStepDefinition = message.includes(
          "Step implementation missing",
        );

        const failedTestStepFinished: messages.TestStepFinished =
          wasUndefinedStepDefinition
            ? {
                testStepId,
                testCaseStartedId,
                testStepResult: {
                  status: TestStepResultStatus.UNDEFINED,
                  duration: {
                    seconds: 0,
                    nanos: 0,
                  },
                },
                timestamp: endTimestamp,
              }
            : {
                testStepId,
                testCaseStartedId,
                testStepResult: {
                  ...(message.includes("Multiple matching step definitions for")
                    ? {
                        status: TestStepResultStatus.AMBIGUOUS,
                        message,
                      }
                    : {
                        status: TestStepResultStatus.FAILED,
                        exception: { type: error.name || "Error", message },
                        message,
                      }),
                  duration: duration(
                    ensure(
                      currentStepStartedAt,
                      "Expected there to be a timestamp for current step",
                    ),
                    endTimestamp,
                  ),
                },
                timestamp: endTimestamp,
              };

        if (wasUndefinedStepDefinition) {
          /**
           * Hack to abort any retry-attempts, as it won't help in this situation. There are no native
           * way of doing this, ref. https://github.com/cypress-io/cypress/issues/19677.
           */
          (this.currentTest as any)!._retries = (
            this.currentTest as any
          )?._currentRetry;
        }

        taskTestStepFinished(context, failedTestStepFinished);

        for (const skippedStep of remainingSteps) {
          const hookIdOrPickleStepId = ensure(
            skippedStep.hook?.id ?? skippedStep.pickleStep?.id,
            "Expected a step to either be a hook or a pickleStep",
          );

          const testStepId = getTestStepId({
            context,
            pickleId: pickle.id,
            hookIdOrPickleStepId,
          });

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: endTimestamp,
          });

          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.SKIPPED,
              duration: {
                seconds: 0,
                nanos: 0,
              },
            },
            timestamp: endTimestamp,
          });
        }
      } else if (this.currentTest?.state === "pending") {
        if (currentStepStartedAt) {
          const skippedStep = ensure(
            remainingSteps.shift(),
            "Expected there to be a remaining step",
          );

          const hookIdOrPickleStepId = ensure(
            skippedStep.hook?.id ?? skippedStep.pickleStep?.id,
            "Expected a step to either be a hook or a pickleStep",
          );

          const testStepId = getTestStepId({
            context,
            pickleId: pickle.id,
            hookIdOrPickleStepId,
          });

          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.SKIPPED,
              duration: duration(currentStepStartedAt, endTimestamp),
            },
            timestamp: endTimestamp,
          });
        }

        for (const remainingStep of remainingSteps) {
          const hookIdOrPickleStepId = ensure(
            remainingStep.hook?.id ?? remainingStep.pickleStep?.id,
            "Expected a step to either be a hook or a pickleStep",
          );

          const testStepId = getTestStepId({
            context,
            pickleId: pickle.id,
            hookIdOrPickleStepId,
          });

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: endTimestamp,
          });

          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.SKIPPED,
              duration: {
                seconds: 0,
                nanos: 0,
              },
            },
            timestamp: endTimestamp,
          });
        }
      } else {
        for (const remainingStep of remainingSteps) {
          const hookIdOrPickleStepId = ensure(
            remainingStep.hook?.id ?? remainingStep.pickleStep?.id,
            "Expected a step to either be a hook or a pickleStep",
          );

          const testStepId = getTestStepId({
            context,
            pickleId: pickle.id,
            hookIdOrPickleStepId,
          });

          taskTestStepStarted(context, {
            testStepId,
            testCaseStartedId,
            timestamp: endTimestamp,
          });

          taskTestStepFinished(context, {
            testStepId,
            testCaseStartedId,
            testStepResult: {
              status: TestStepResultStatus.UNKNOWN,
              duration: {
                seconds: 0,
                nanos: 0,
              },
            },
            timestamp: endTimestamp,
          });
        }
      }
    } catch (e) {
      if (
        e instanceof CypressCucumberAssertionError &&
        context.isTrackingState &&
        context.softErrors
      ) {
        taskFrontEndTrackingError(e);
      } else {
        throw e;
      }
    }
  }

  const currentRetry = ensure(
    (this.currentTest as any)?._currentRetry,
    "Expected to find an attribute _currentRetry",
  );

  const retries = ensure(
    (this.currentTest as any)?._retries,
    "Expected to find an attribute _retries",
  );

  const willBeRetried =
    this.currentTest?.state === "failed" ? currentRetry < retries : false;

  taskTestCaseFinished(context, {
    testCaseStartedId,
    timestamp: endTimestamp,
    willBeRetried,
  });

  /**
   * Repopulate internal properties in case previous test is retried.
   */
  if (willBeRetried) {
    updateInternalSpecProperties({
      testCaseStartedId: context.newId(),
      remainingSteps: [...properties.allSteps],
    });
  } else {
    context.includedPickles.shift();

    while (
      context.includedPickles.length > 0 &&
      context.includedPickles[0].willBekipped
    ) {
      emitSkippedPickle(context, context.includedPickles.shift()!);
    }
  }
}

function afterHandler(this: Mocha.Context, context: CompositionContext) {
  const { registry } = context;

  registry.resolveAfterAllHooks().reduce(
    (chain, hook) => {
      return chain.then(() =>
        runStepWithLogGroup({
          fn: context.dryRun ? noopFn : () => registry.runRunHook(this, hook),
          keyword: "AfterAll",
        }),
      );
    },
    cy.wrap({} as unknown, { log: false }),
  );
}

export default function createTests(
  registry: Registry<Mocha.Context, unknown[]>,
  seed: number,
  source: string,
  gherkinDocument: messages.GherkinDocument,
  pickles: messages.Pickle[],
  isTrackingState: boolean,
  softErrors: boolean,
  omitFiltered: boolean,
  stepDefinitionHints: {
    stepDefinitions: string | string[];
    stepDefinitionPatterns: string[];
    stepDefinitionPaths: string[];
  },
  dryRun: boolean,
) {
  const prng = random(seed.toString());

  const newId: messages.IdGenerator.NewId = () =>
    uuid({
      random: Array.from({ length: 16 }, () => Math.floor(prng() * 256)),
    });

  registry.finalize(newId);

  const testFilter = createTestFilter(gherkinDocument, Cypress.env());

  const stepDefinitions: messages.StepDefinition[] =
    registry.stepDefinitions.map((stepDefinition) => {
      const type: messages.StepDefinitionPatternType =
        stepDefinition.expression instanceof RegularExpression
          ? StepDefinitionPatternType.REGULAR_EXPRESSION
          : StepDefinitionPatternType.CUCUMBER_EXPRESSION;

      return {
        id: stepDefinition.id,
        pattern: {
          type,
          source: stepDefinition.expression.source,
        },
        sourceReference: getSourceReferenceFromPosition(
          stepDefinition.position,
        ),
      };
    });

  const testStepIds: TestStepIds = new Map();

  const includedPickles = pickles.filter((pickle) => {
    return !omitFiltered || !shouldSkipPickle(testFilter, pickle);
  });

  const testCases: messages.TestCase[] = includedPickles.map((pickle) => {
    const tags = collectTagNames(pickle.tags);
    const beforeHooks = registry.resolveBeforeHooks(tags);
    const afterHooks = registry.resolveAfterHooks(tags);

    const hooksToStep = (hook: ICaseHook<Mocha.Context>): messages.TestStep => {
      return {
        id: createTestStepId({
          testStepIds,
          newId,
          pickleId: pickle.id,
          hookIdOrPickleStepId: hook.id,
        }),
        hookId: hook.id,
      };
    };

    const pickleStepToTestStep = (
      pickleStep: messages.PickleStep,
    ): messages.TestStep => {
      const stepDefinitions = registry.getMatchingStepDefinitions(
        pickleStep.text,
      );

      return {
        id: createTestStepId({
          testStepIds,
          newId,
          pickleId: pickle.id,
          hookIdOrPickleStepId: pickleStep.id,
        }),
        pickleStepId: pickleStep.id,
        stepDefinitionIds: stepDefinitions.map(
          (stepDefinition) => stepDefinition.id,
        ),
        stepMatchArgumentsLists: stepDefinitions.map((stepDefinition) => {
          const result = stepDefinition.expression.match(pickleStep.text);

          return {
            stepMatchArguments: (result ?? []).map((arg) => {
              return {
                group: mapArgumentGroup(arg.group),
                parameterTypeName: arg.parameterType.name,
              };
            }),
          };
        }),
      };
    };

    return {
      id: pickle.id,
      pickleId: pickle.id,
      testSteps: [
        ...beforeHooks.map(hooksToStep),
        ...pickle.steps.map(pickleStepToTestStep),
        ...afterHooks.map(hooksToStep),
      ],
    };
  });

  const specEnvelopes: messages.Envelope[] = [];

  specEnvelopes.push({
    source: {
      data: source,
      uri: ensure(gherkinDocument.uri, "Expected gherkin document to have URI"),
      mediaType: SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
    },
  });

  specEnvelopes.push({
    gherkinDocument,
  });

  for (const pickle of includedPickles) {
    specEnvelopes.push({
      pickle,
    });
  }

  for (const hook of registry.caseHooks) {
    specEnvelopes.push({
      hook: {
        id: hook.id,
        name: hook.name,
        sourceReference: getSourceReferenceFromPosition(hook.position),
        tagExpression: hook.tags,
        type:
          hook.keyword === "Before"
            ? HookType.BEFORE_TEST_CASE
            : HookType.AFTER_TEST_CASE,
      },
    });
  }

  for (const parameterType of registry.parameterTypeRegistry.parameterTypes) {
    if (parameterType.builtin) {
      continue;
    }

    // ! to make TS happy.
    specEnvelopes.push({
      parameterType: {
        id: newId(),
        name: parameterType.name!,
        preferForRegularExpressionMatch: parameterType.preferForRegexpMatch!,
        regularExpressions: parameterType.regexpStrings,
        useForSnippets: parameterType.useForSnippets!,
        sourceReference: getSourceReferenceFromPosition(),
      },
    });
  }

  for (const stepDefinition of stepDefinitions) {
    specEnvelopes.push({
      stepDefinition,
    });
  }

  for (const testCase of testCases) {
    specEnvelopes.push({
      testCase,
    });
  }

  const context: CompositionContext = {
    registry,
    newId,
    gherkinDocument,
    astIdsMap: createAstIdMap(gherkinDocument),
    testStepIds,
    pickles,
    includedPickles: includedPickles.map((pickle) => {
      return { ...pickle, willBekipped: shouldSkipPickle(testFilter, pickle) };
    }),
    specEnvelopes,
    testFilter,
    omitFiltered,
    isTrackingState,
    softErrors,
    stepDefinitionHints,
    dryRun,
  };

  if (gherkinDocument.feature) {
    createFeature(context, gherkinDocument.feature);
  }
}

type Tail<T extends any[]> = T extends [infer _A, ...infer R] ? R : never;

export type CreateTestsOptions = Tail<Parameters<typeof createTests>>;

function strictIsInteractive(): boolean {
  const isInteractive = Cypress.config(
    "isInteractive" as keyof Cypress.ConfigOptions,
  );

  if (typeof isInteractive === "boolean") {
    return isInteractive;
  }

  throw new Error(
    "Expected to find a Cypress configuration property `isInteractive`, but didn't",
  );
}

function createMissingStepDefinitionMessage(
  context: CompositionContext,
  pickleStep: messages.PickleStep,
  parameterTypeRegistry: ParameterTypeRegistry,
) {
  const noStepDefinitionPathsTemplate = `
    Step implementation missing for "<text>".

    We tried searching for files containing step definitions using the following search pattern templates:

    <step-definitions>

    These templates resolved to the following search patterns:

    <step-definition-patterns>

    These patterns matched **no files** containing step definitions. This almost certainly means that you have misconfigured \`stepDefinitions\`.

    You can implement it using the suggestion(s) below.

    <snippets>
  `;

  const someStepDefinitionPathsTemplate = `
    Step implementation missing for "<text>".

    We tried searching for files containing step definitions using the following search pattern templates:

    <step-definitions>

    These templates resolved to the following search patterns:

    <step-definition-patterns>

    These patterns matched the following files:

    <step-definition-paths>

    However, none of these files contained a step definition matching "<text>".

    You can implement it using the suggestion(s) below.

    <snippets>
  `;

  const { stepDefinitionHints } = context;

  const template =
    stepDefinitionHints.stepDefinitionPaths.length > 0
      ? someStepDefinitionPathsTemplate
      : noStepDefinitionPathsTemplate;

  const maybeEscape = (string: string) =>
    strictIsInteractive() ? string.replaceAll("*", "\\*") : string;

  const prettyPrintList = (items: string[]) =>
    items.map((item) => "  - " + maybeEscape(item)).join("\n");

  let parameter: "dataTable" | "docString" | null = null;

  if (pickleStep.argument?.dataTable) {
    parameter = "dataTable";
  } else if (pickleStep.argument?.docString) {
    parameter = "docString";
  }

  const snippets = new CucumberExpressionGenerator(
    () => parameterTypeRegistry.parameterTypes,
  )
    .generateExpressions(pickleStep.text)
    .map((expression) =>
      generateSnippet(
        expression,
        ensure(pickleStep.type, "Expected pickleStep to have a type"),
        parameter,
      ),
    )
    .map((snippet) => indent(snippet, { count: 2 }))
    .join("\n\n");

  return stripIndent(template)
    .replaceAll("<text>", pickleStep.text)
    .replaceAll(
      "<step-definitions>",
      prettyPrintList([stepDefinitionHints.stepDefinitions].flat()),
    )
    .replaceAll(
      "<step-definition-patterns>",
      prettyPrintList(stepDefinitionHints.stepDefinitionPatterns),
    )
    .replaceAll(
      "<step-definition-paths>",
      prettyPrintList(stepDefinitionHints.stepDefinitionPaths),
    )
    .replaceAll("<snippets>", snippets);
}

function mapArgumentGroup(group: Group): messages.Group {
  return {
    start: group.start,
    value: group.value,
    children:
      group.children != null
        ? group.children.map((child) => mapArgumentGroup(child))
        : (undefined as any),
  };
}
