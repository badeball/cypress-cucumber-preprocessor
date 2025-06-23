import type * as messages from "@cucumber/messages";

import parse from "@cucumber/tag-expressions";

import { fromByteArray } from "base64-js";

import { createError } from "./helpers/error";

import { collectTagNames } from "./helpers/ast";

import { INTERNAL_SPEC_PROPERTIES } from "./constants";

import {
  ITaskCreateStringAttachment,
  TASK_CREATE_STRING_ATTACHMENT,
} from "./cypress-task-definitions";

import { retrieveInternalSpecProperties } from "./browser-runtime";

import { runStepWithLogGroup } from "./helpers/cypress";

import DataTable from "./data_table";

import { getRegistry } from "./registry";

import {
  ICaseHookBody,
  ICaseHookOptions,
  IParameterTypeDefinition,
  IRunHookBody,
  IRunHookOptions,
  IStepDefinitionBody,
  IStepHookBody,
  IStepHookOptions,
} from "./public-member-types";

import {
  ConfigurationFileResolver,
  ICypressRuntimeConfiguration,
  IPreprocessorConfiguration,
} from "./preprocessor-configuration";

import { AddOptions } from "./add-cucumber-preprocessor-plugin";

import { AttachmentContentEncoding } from "./helpers/messages-enums";

function defineStep<T extends unknown[], C extends Mocha.Context>(
  description: string | RegExp,
  implementation: IStepDefinitionBody<T, C>,
) {
  getRegistry<C, T>().defineStep(description, implementation);
}

function runStepDefinition(
  world: Mocha.Context,
  text: string,
  argument?: DataTable | string,
) {
  cy.then(() => {
    runStepWithLogGroup({
      keyword: "Step",
      text,
      fn: () => getRegistry().runStepDefinition(world, text, false, argument),
    });
  });
}

function defineParameterType<T, C extends Mocha.Context>(
  options: IParameterTypeDefinition<T, C>,
) {
  getRegistry().defineParameterType(options);
}

function defineBefore<C extends Mocha.Context>(
  options: ICaseHookOptions,
  fn: ICaseHookBody<C>,
): void;
function defineBefore<C extends Mocha.Context>(fn: ICaseHookBody<C>): void;
function defineBefore<C extends Mocha.Context>(
  optionsOrFn: ICaseHookBody<C> | ICaseHookOptions,
  maybeFn?: ICaseHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineBefore({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineBefore(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for Before hook");
  }
}

function defineAfter<C extends Mocha.Context>(
  options: ICaseHookOptions,
  fn: ICaseHookBody<C>,
): void;
function defineAfter<C extends Mocha.Context>(fn: ICaseHookBody<C>): void;
function defineAfter<C extends Mocha.Context>(
  optionsOrFn: ICaseHookBody<C> | ICaseHookOptions,
  maybeFn?: ICaseHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineAfter({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineAfter(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for After hook");
  }
}

function defineBeforeStep<C extends Mocha.Context>(
  options: IStepHookOptions,
  fn: IStepHookBody<C>,
): void;
function defineBeforeStep<C extends Mocha.Context>(fn: IStepHookBody<C>): void;
function defineBeforeStep<C extends Mocha.Context>(
  optionsOrFn: IStepHookBody<C> | IStepHookOptions,
  maybeFn?: IStepHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineBeforeStep({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineBeforeStep(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for BeforeStep hook");
  }
}

function defineAfterStep<C extends Mocha.Context>(
  options: IStepHookOptions,
  fn: IStepHookBody<C>,
): void;
function defineAfterStep<C extends Mocha.Context>(fn: IStepHookBody<C>): void;
function defineAfterStep<C extends Mocha.Context>(
  optionsOrFn: IStepHookBody<C> | IStepHookOptions,
  maybeFn?: IStepHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineAfterStep({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineAfterStep(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for AfterStep hook");
  }
}

function defineBeforeAll<C extends Mocha.Context>(
  options: IRunHookOptions,
  fn: IRunHookBody<C>,
): void;
function defineBeforeAll<C extends Mocha.Context>(fn: IRunHookBody<C>): void;
function defineBeforeAll<C extends Mocha.Context>(
  optionsOrFn: IRunHookBody<C> | IRunHookOptions,
  maybeFn?: IRunHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineBeforeAll({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineBeforeAll(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for BeforeAll hook");
  }
}

function defineAfterAll<C extends Mocha.Context>(
  options: IRunHookOptions,
  fn: IRunHookBody<C>,
): void;
function defineAfterAll<C extends Mocha.Context>(fn: IRunHookBody<C>): void;
function defineAfterAll<C extends Mocha.Context>(
  optionsOrFn: IRunHookBody<C> | IRunHookOptions,
  maybeFn?: IRunHookBody<C>,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry<C, unknown[]>().defineAfterAll({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry<C, unknown[]>().defineAfterAll(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for AfterAll hook");
  }
}

function createStringAttachment(
  data: string,
  mediaType: string,
  encoding: messages.AttachmentContentEncoding,
) {
  const taskData: ITaskCreateStringAttachment = {
    data,
    mediaType,
    encoding,
  };

  cy.task(TASK_CREATE_STRING_ATTACHMENT, taskData, {
    log: false,
  });
}

export function attach(data: string | ArrayBuffer, mediaType?: string) {
  if (typeof data === "string") {
    mediaType = mediaType ?? "text/plain";

    if (mediaType.startsWith("base64:")) {
      createStringAttachment(
        data,
        mediaType.replace("base64:", ""),
        AttachmentContentEncoding.BASE64,
      );
    } else {
      createStringAttachment(
        data,
        mediaType ?? "text/plain",
        AttachmentContentEncoding.IDENTITY,
      );
    }
  } else if (data instanceof ArrayBuffer) {
    if (typeof mediaType !== "string") {
      throw Error("ArrayBuffer attachments must specify a media type");
    }

    createStringAttachment(
      fromByteArray(new Uint8Array(data)),
      mediaType,
      AttachmentContentEncoding.BASE64,
    );
  } else {
    throw Error("Invalid attachment data: must be a ArrayBuffer or string");
  }
}

function isFeature() {
  return Cypress.env(INTERNAL_SPEC_PROPERTIES) != null;
}

const NOT_FEATURE_ERROR =
  "Expected to find internal properties, but didn't. This is likely because you're calling doesFeatureMatch() in a non-feature spec. Use doesFeatureMatch() in combination with isFeature() if you have both feature and non-feature specs";

function doesFeatureMatch(expression: string) {
  let pickle: messages.Pickle;

  try {
    pickle = retrieveInternalSpecProperties().pickle;
  } catch {
    throw createError(NOT_FEATURE_ERROR);
  }

  return parse(expression).evaluate(collectTagNames(pickle.tags));
}

export {
  DataTable,
  isFeature,
  doesFeatureMatch,
  defineStep as Given,
  defineStep as When,
  defineStep as Then,
  defineStep,
  runStepDefinition as Step,
  defineParameterType,
  defineBefore as Before,
  defineAfter as After,
  defineBeforeStep as BeforeStep,
  defineAfterStep as AfterStep,
  defineBeforeAll as BeforeAll,
  defineAfterAll as AfterAll,
};

/**
 * Everything below exist merely for the purpose of being nice with TypeScript. All of these methods
 * are exclusively used in the node environment and the node field in package.json points to
 * ./lib/entrypoint-node.ts.
 */
function createUnimplemented() {
  return new Error("Plugin methods aren't available in a browser environment");
}

export { IPreprocessorConfiguration };

export function resolvePreprocessorConfiguration(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cypressConfig: ICypressRuntimeConfiguration,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  environment: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  implicitIntegrationFolder: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configurationFileResolver?: ConfigurationFileResolver,
): Promise<IPreprocessorConfiguration> {
  throw createUnimplemented();
}

export async function addCucumberPreprocessorPlugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: AddOptions = {},
): Promise<Cypress.PluginConfigOptions> {
  throw createUnimplemented();
}

export async function beforeRunHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: Cypress.PluginConfigOptions,
): Promise<void> {
  throw createUnimplemented();
}

export async function afterRunHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: Cypress.PluginConfigOptions,
): Promise<void> {
  throw createUnimplemented();
}

export async function beforeSpecHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: Cypress.PluginConfigOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  spec: Cypress.Spec,
): Promise<void> {
  throw createUnimplemented();
}

export async function afterSpecHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: Cypress.PluginConfigOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  spec: Cypress.Spec,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results: CypressCommandLine.RunResult,
): Promise<void> {
  throw createUnimplemented();
}

export async function afterScreenshotHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: Cypress.PluginConfigOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  details: Cypress.ScreenshotDetails,
): Promise<Cypress.ScreenshotDetails> {
  throw createUnimplemented();
}
