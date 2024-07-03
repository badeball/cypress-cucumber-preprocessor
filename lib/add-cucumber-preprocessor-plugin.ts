import fs from "fs";

import { inspect } from "node:util";

import { IdGenerator, SourceMediaType } from "@cucumber/messages";

import parse from "@cucumber/tag-expressions";

import { generateMessages } from "@cucumber/gherkin";

import { getSpecs } from "find-cypress-specs";

import { INTERNAL_PROPERTY_NAME, INTERNAL_SUITE_PROPERTIES } from "./constants";

import {
  TASK_SPEC_ENVELOPES,
  TASK_CREATE_STRING_ATTACHMENT,
  TASK_TEST_CASE_STARTED,
  TASK_TEST_STEP_STARTED,
  TASK_TEST_STEP_FINISHED,
  TASK_TEST_CASE_FINISHED,
} from "./cypress-task-definitions";

import {
  afterRunHandler,
  afterScreenshotHandler,
  afterSpecHandler,
  specEnvelopesHandler,
  beforeRunHandler,
  beforeSpecHandler,
  createStringAttachmentHandler,
  testCaseStartedHandler,
  testStepStartedHandler,
  testStepFinishedHandler,
  testCaseFinishedHandler,
  OnAfterStep,
} from "./plugin-event-handlers";

import { resolve as origResolve } from "./preprocessor-configuration";

import { notNull } from "./helpers/type-guards";

import { getTags } from "./helpers/environment";

import { memoize } from "./helpers/memoize";

import { assertNever } from "./helpers/assertions";

import debug from "./helpers/debug";

const resolve = memoize(origResolve);

export type AddOptions = {
  omitBeforeRunHandler?: boolean;
  omitAfterRunHandler?: boolean;
  omitBeforeSpecHandler?: boolean;
  omitAfterSpecHandler?: boolean;
  omitAfterScreenshotHandler?: boolean;
  onAfterStep?: OnAfterStep;
};

type PreservedPluginConfigOptions = Cypress.PluginConfigOptions & {
  [INTERNAL_PROPERTY_NAME]?: Partial<Cypress.PluginConfigOptions>;
};

export function mutateConfigObjectPreservingly<
  K extends keyof Cypress.PluginConfigOptions,
>(
  config: PreservedPluginConfigOptions,
  property: K,
  value: PreservedPluginConfigOptions[K],
) {
  const preserved =
    config[INTERNAL_PROPERTY_NAME] ?? (config[INTERNAL_PROPERTY_NAME] = {});
  preserved[property] = config[property];
  config[property] = value;
}

export function rebuildOriginalConfigObject(
  config: PreservedPluginConfigOptions,
): Cypress.PluginConfigOptions {
  return Object.assign({}, config, config[INTERNAL_PROPERTY_NAME]);
}

export async function addCucumberPreprocessorPlugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
  options: AddOptions = {},
) {
  config.env[INTERNAL_SUITE_PROPERTIES] = { isEventHandlersAttached: true };

  const preprocessor = await resolve(config, config.env, "/");

  if (!options.omitBeforeRunHandler) {
    on("before:run", () => beforeRunHandler(config));
  }

  if (!options.omitAfterRunHandler) {
    on("after:run", (results) => afterRunHandler(config, results));
  }

  if (!options.omitBeforeSpecHandler) {
    on("before:spec", (spec) => beforeSpecHandler(config, spec));
  }

  if (!options.omitAfterSpecHandler) {
    on("after:spec", (spec, results) =>
      afterSpecHandler(config, spec, results),
    );
  }

  if (!options.omitAfterScreenshotHandler) {
    on("after:screenshot", (details) =>
      afterScreenshotHandler(config, details),
    );
  }

  on("task", {
    [TASK_SPEC_ENVELOPES]: specEnvelopesHandler.bind(null, config),
    [TASK_TEST_CASE_STARTED]: testCaseStartedHandler.bind(null, config),
    [TASK_TEST_STEP_STARTED]: testStepStartedHandler.bind(null, config),
    [TASK_TEST_STEP_FINISHED]: testStepFinishedHandler.bind(
      null,
      config,
      options,
    ),
    [TASK_TEST_CASE_FINISHED]: testCaseFinishedHandler.bind(null, config),
    [TASK_CREATE_STRING_ATTACHMENT]: createStringAttachmentHandler.bind(
      null,
      config,
    ),
  });

  const tags = getTags(config.env);

  if (tags !== null && preprocessor.filterSpecs) {
    debug(`Filtering specs using expression ${inspect(tags)}`);

    const node = parse(tags);

    const testFiles = getSpecs(config, "foobar" as any, true).filter(
      (testFile) => {
        if (!testFile.endsWith(".feature")) {
          switch (preprocessor.filterSpecsMixedMode) {
            case "hide":
              return false;
            case "show":
              return true;
            case "empty-set":
              return node.evaluate([]);
            default:
              assertNever(preprocessor.filterSpecsMixedMode);
          }
        }

        const content = fs.readFileSync(testFile).toString("utf-8");

        const options = {
          includeSource: false,
          includeGherkinDocument: false,
          includePickles: true,
          newId: IdGenerator.incrementing(),
        };

        const envelopes = generateMessages(
          content,
          testFile,
          SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
          options,
        );

        const pickles = envelopes
          .map((envelope) => envelope.pickle)
          .filter(notNull);

        return pickles.some((pickle) =>
          node.evaluate(
            pickle.tags?.map((tag) => tag.name).filter(notNull) ?? [],
          ),
        );
      },
    );

    debug(`Resolved specs ${inspect(testFiles)}`);

    const propertyName = "specPattern" in config ? "specPattern" : "testFiles";

    /**
     * The preprocessor needs the original value at a later point in order to determine the implicit
     * integration folder correctly. Otherwise, scoping test files using tags would affect definition
     * resolvement and yield surprising results.
     */
    mutateConfigObjectPreservingly(
      config,
      propertyName as keyof Cypress.PluginConfigOptions,
      testFiles,
    );
  }

  if (preprocessor.dryRun) {
    config.supportFile = false;
  }

  return config;
}
