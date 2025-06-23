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

function defineBefore(options: ICaseHookOptions, fn: ICaseHookBody): void;
function defineBefore(fn: ICaseHookBody): void;
function defineBefore(
  optionsOrFn: ICaseHookBody | ICaseHookOptions,
  maybeFn?: ICaseHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineBefore({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineBefore(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for Before hook");
  }
}

function defineAfter(options: ICaseHookOptions, fn: ICaseHookBody): void;
function defineAfter(fn: ICaseHookBody): void;
function defineAfter(
  optionsOrFn: ICaseHookBody | ICaseHookOptions,
  maybeFn?: ICaseHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineAfter({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineAfter(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for After hook");
  }
}

function defineBeforeStep(options: IStepHookOptions, fn: IStepHookBody): void;
function defineBeforeStep(fn: IStepHookBody): void;
function defineBeforeStep(
  optionsOrFn: IStepHookBody | IStepHookOptions,
  maybeFn?: IStepHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineBeforeStep({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineBeforeStep(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for BeforeStep hook");
  }
}

function defineAfterStep(options: IStepHookOptions, fn: IStepHookBody): void;
function defineAfterStep(fn: IStepHookBody): void;
function defineAfterStep(
  optionsOrFn: IStepHookBody | IStepHookOptions,
  maybeFn?: IStepHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineAfterStep({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineAfterStep(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for AfterStep hook");
  }
}

function defineBeforeAll(options: IRunHookOptions, fn: IRunHookBody): void;
function defineBeforeAll(fn: IRunHookBody): void;
function defineBeforeAll(
  optionsOrFn: IRunHookBody | IRunHookOptions,
  maybeFn?: IRunHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineBeforeAll({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineBeforeAll(optionsOrFn, maybeFn);
  } else {
    throw new Error("Unexpected argument for BeforeAll hook");
  }
}

function defineAfterAll(options: IRunHookOptions, fn: IRunHookBody): void;
function defineAfterAll(fn: IRunHookBody): void;
function defineAfterAll(
  optionsOrFn: IRunHookBody | IRunHookOptions,
  maybeFn?: IRunHookBody,
) {
  if (typeof optionsOrFn === "function") {
    getRegistry().defineAfterAll({}, optionsOrFn);
  } else if (typeof optionsOrFn === "object" && typeof maybeFn === "function") {
    getRegistry().defineAfterAll(optionsOrFn, maybeFn);
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
