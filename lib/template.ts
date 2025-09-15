import path from "path";

import { inspect } from "util";

import { generateMessages } from "@cucumber/gherkin";

import { IdGenerator, SourceMediaType } from "@cucumber/messages";

import { getSpecs } from "find-cypress-specs";

import ancestor from "common-ancestor-path";

import { ensure } from "./helpers/assertions";

import { resolve } from "./preprocessor-configuration";

import {
  getStepDefinitionPaths,
  getStepDefinitionPatterns,
} from "./step-definitions";

import { notNull } from "./helpers/type-guards";

import { ensureIsRelative } from "./helpers/paths";

import { rebuildOriginalConfigObject } from "./add-cucumber-preprocessor-plugin";

import debug from "./helpers/debug";

import type { CreateTestsOptions } from "./browser-runtime";

const { stringify } = JSON;

export async function compile(
  configuration: Cypress.PluginConfigOptions,
  data: string,
  uri: string,
) {
  configuration = rebuildOriginalConfigObject(configuration);

  const options = {
    includeSource: false,
    includeGherkinDocument: true,
    includePickles: true,
    newId: IdGenerator.uuid(),
  };

  const relativeUri = path.relative(configuration.projectRoot, uri);

  const envelopes = generateMessages(
    data,
    relativeUri,
    SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
    options,
  );

  if (envelopes[0].parseError) {
    throw new Error(
      ensure(
        envelopes[0].parseError.message,
        "Expected parse error to have a description",
      ),
    );
  }

  const gherkinDocument = ensure(
    envelopes.map((envelope) => envelope.gherkinDocument).find(notNull),
    "Expected to find a gherkin document amongst the envelopes.",
  );

  const pickles = envelopes.map((envelope) => envelope.pickle).filter(notNull);

  const implicitIntegrationFolder = ensure(
    ancestor(
      ...getSpecs(configuration, "foobar" as any, true)
        .map(path.dirname)
        .map(path.normalize),
    ),
    "Expected to find a common ancestor path",
  );

  const preprocessor = await resolve(
    configuration,
    configuration.env,
    implicitIntegrationFolder,
  );

  const { stepDefinitions } = preprocessor;

  debug(
    `resolving step definitio|ns using template(s) ${inspect(stepDefinitions)}`,
  );

  const stepDefinitionPatterns = getStepDefinitionPatterns(
    preprocessor,
    uri,
  ).map((pattern) => ensureIsRelative(configuration.projectRoot, pattern));

  debug(
    `for ${inspect(
      ensureIsRelative(configuration.projectRoot, uri),
    )} yielded patterns ${inspect(stepDefinitionPatterns)}`,
  );

  const stepDefinitionPaths = await getStepDefinitionPaths(
    configuration.projectRoot,
    stepDefinitionPatterns,
  );

  if (stepDefinitionPaths.length === 0) {
    debug("found no step definitions");
  } else {
    debug(
      `found step definitions ${inspect(
        stepDefinitionPaths.map((path) =>
          ensureIsRelative(configuration.projectRoot, path),
        ),
      )}`,
    );
  }

  const prepareLibPath = (...parts: string[]) =>
    stringify(path.join(__dirname, ...parts));

  const createTestsPath = prepareLibPath("browser-runtime");

  const prepareRegistryPath = prepareLibPath("helpers", "prepare-registry");

  const dryRun = prepareLibPath("helpers", "dry-run");

  const ensureRelativeToProjectRoot = (path: string) =>
    ensureIsRelative(configuration.projectRoot, path);

  const createTestsOptions: CreateTestsOptions = [
    new Date().getTime(),
    data,
    gherkinDocument,
    pickles,
    preprocessor.isTrackingState,
    preprocessor.state.softErrors,
    preprocessor.omitFiltered,
    {
      stepDefinitions,
      stepDefinitionPatterns: stepDefinitionPatterns.map(
        ensureRelativeToProjectRoot,
      ),
      stepDefinitionPaths: stepDefinitionPaths.map(ensureRelativeToProjectRoot),
    },
    preprocessor.dryRun,
  ];

  return `
    ${preprocessor.dryRun ? `require(${dryRun})` : ""}
    const { getAndFreeRegistry } = require(${prepareRegistryPath});
    const { default: createTests } = require(${createTestsPath});
    ${stepDefinitionPaths
      .map((stepDefinition) => `require(${stringify(stepDefinition)});`)
      .join("\n    ")}

    const registry = getAndFreeRegistry();

    createTests(registry, ...${stringify(createTestsOptions)});
  `;
}
