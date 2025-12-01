import util from "node:util";

import { cosmiconfig } from "cosmiconfig";
import { isRight } from "fp-ts/Either";
import * as D from "io-ts/Decoder";

import debug from "./helpers/debug";
import { CypressCucumberError } from "./helpers/error";
import { ensureIsRelative } from "./helpers/paths";

function decode<I, O>(decoder: D.Decoder<I, O>, val: I): O {
  const res = decoder.decode(val);

  if (isRight(res)) {
    return res.right;
  } else {
    throw new CypressCucumberError(D.draw(res.left));
  }
}

function stringToMaybeBoolean(value: string): boolean | undefined {
  if (value === "") {
    return;
  }

  const falsyValues = ["0", "false"];

  if (falsyValues.includes(value)) {
    return false;
  } else {
    return true;
  }
}

export type ICypressRuntimeConfiguration = Pick<
  Cypress.PluginConfigOptions,
  | "isTextTerminal"
  | "testingType"
  | "projectRoot"
  | "reporter"
  | "specPattern"
  | "excludeSpecPattern"
  | "env"
>;

const FilterSpecsMixedMode = D.union(
  D.literal("hide"),
  D.literal("show"),
  D.literal("empty-set"),
);

export type IFilterSpecsMixedMode = D.TypeOf<typeof FilterSpecsMixedMode>;

const StringishToBoolean: D.Decoder<unknown, boolean | undefined> = {
  decode: (val) => {
    if (typeof val === "string") {
      return D.success(stringToMaybeBoolean(val));
    } else if (typeof val === "boolean") {
      return D.success(val);
    } else {
      return D.failure(val, "string");
    }
  },
};

const EnvironmentOverrides = D.partial({
  stepDefinitions: D.union(D.string, D.array(D.string)),
  stateSoftErrors: StringishToBoolean,
  messagesEnabled: StringishToBoolean,
  messagesOutput: D.string,
  jsonEnabled: StringishToBoolean,
  jsonOutput: D.string,
  htmlEnabled: StringishToBoolean,
  htmlOutput: D.string,
  usageEnabled: StringishToBoolean,
  usageOutput: D.string,
  prettyEnabled: StringishToBoolean,
  filterSpecsMixedMode: FilterSpecsMixedMode,
  filterSpecs: StringishToBoolean,
  omitFiltered: StringishToBoolean,
  dryRun: StringishToBoolean,
  attachmentsAddScreenshots: StringishToBoolean,
  attachmentsAddVideos: StringishToBoolean,
});

type IEnvironmentOverrides = D.TypeOf<typeof EnvironmentOverrides>;

const BaseConfiguration = D.partial({
  stepDefinitions: D.union(D.string, D.array(D.string)),
  state: D.partial({
    softErrors: D.boolean,
  }),
  messages: D.partial({
    enabled: D.boolean,
    output: D.string,
  }),
  json: D.partial({
    enabled: D.boolean,
    output: D.string,
  }),
  html: D.partial({
    enabled: D.boolean,
    output: D.string,
  }),
  usage: D.partial({
    enabled: D.boolean,
    output: D.string,
  }),
  pretty: D.partial({
    enabled: D.boolean,
  }),
  filterSpecsMixedMode: FilterSpecsMixedMode,
  filterSpecs: D.boolean,
  omitFiltered: D.boolean,
  dryRun: D.boolean,
  attachments: D.partial({
    addScreenshots: D.boolean,
    addVideos: D.boolean,
  }),
});

export type IBaseUserConfiguration = D.TypeOf<typeof BaseConfiguration>;

const UserConfiguration = D.intersect(
  D.partial({
    e2e: BaseConfiguration,
    component: BaseConfiguration,
  }),
)(BaseConfiguration);

export type IUserConfiguration = D.TypeOf<typeof UserConfiguration>;

export interface IPreprocessorConfiguration {
  readonly stepDefinitions: string | string[];
  readonly state: {
    softErrors: boolean;
  };
  readonly messages: {
    enabled: boolean;
    output: string;
  };
  readonly json: {
    enabled: boolean;
    output: string;
  };
  readonly html: {
    enabled: boolean;
    output: string;
  };
  readonly usage: {
    enabled: boolean;
    output: string;
  };
  readonly pretty: {
    enabled: boolean;
  };
  readonly filterSpecsMixedMode: D.TypeOf<typeof FilterSpecsMixedMode>;
  readonly filterSpecs: boolean;
  readonly omitFiltered: boolean;
  readonly implicitIntegrationFolder: string;
  readonly isTrackingState: boolean;
  readonly dryRun: boolean;
  readonly attachments: {
    addScreenshots: boolean;
    addVideos: boolean;
  };
}

const DEFAULT_STEP_DEFINITIONS = [
  "[integration-directory]/[filepath]/**/*.{js,mjs,ts,tsx}",
  "[integration-directory]/[filepath].{js,mjs,ts,tsx}",
  "cypress/support/step_definitions/**/*.{js,mjs,ts,tsx}",
];

export const COMPILED_REPORTER_ENTRYPOINT =
  "dist/subpath-entrypoints/pretty-reporter.js";

export function combineIntoConfiguration(
  configuration: IUserConfiguration,
  overrides: IEnvironmentOverrides,
  cypress: ICypressRuntimeConfiguration,
  implicitIntegrationFolder: string,
): IPreprocessorConfiguration {
  const defaultStepDefinitions = DEFAULT_STEP_DEFINITIONS.map((pattern) =>
    pattern.replace(
      "[integration-directory]",
      ensureIsRelative(cypress.projectRoot, implicitIntegrationFolder),
    ),
  );

  const specific = configuration[cypress.testingType];
  const unspecific = configuration;

  const stepDefinitions: IPreprocessorConfiguration["stepDefinitions"] =
    overrides.stepDefinitions ??
    specific?.stepDefinitions ??
    unspecific.stepDefinitions ??
    defaultStepDefinitions;

  const json: IPreprocessorConfiguration["json"] = {
    enabled:
      overrides.jsonEnabled ??
      specific?.json?.enabled ??
      unspecific.json?.enabled ??
      false,
    output:
      overrides.jsonOutput ??
      specific?.json?.output ??
      unspecific.json?.output ??
      "cucumber-report.json",
  };

  const html: IPreprocessorConfiguration["html"] = {
    enabled:
      overrides.htmlEnabled ??
      specific?.html?.enabled ??
      unspecific.html?.enabled ??
      false,
    output:
      overrides.htmlOutput ??
      specific?.html?.output ??
      unspecific.html?.output ??
      "cucumber-report.html",
  };

  const messages: IPreprocessorConfiguration["messages"] = {
    enabled:
      overrides.messagesEnabled ??
      specific?.messages?.enabled ??
      unspecific.messages?.enabled ??
      false,
    output:
      overrides.messagesOutput ??
      specific?.messages?.output ??
      unspecific.messages?.output ??
      "cucumber-messages.ndjson",
  };

  const state: IPreprocessorConfiguration["state"] = {
    softErrors:
      overrides.stateSoftErrors ??
      specific?.state?.softErrors ??
      unspecific.state?.softErrors ??
      false,
  };

  const usage: IPreprocessorConfiguration["usage"] = {
    enabled:
      overrides.usageEnabled ??
      specific?.usage?.enabled ??
      unspecific.usage?.enabled ??
      false,
    output:
      overrides.usageOutput ??
      specific?.usage?.output ??
      unspecific.usage?.output ??
      "stdout",
  };

  const usingPrettyReporter = cypress.reporter.endsWith(
    COMPILED_REPORTER_ENTRYPOINT,
  );

  if (usingPrettyReporter) {
    debug(
      "detected use of @badeball/cypress-cucumber-preprocessor/pretty-reporter, enabling pretty output",
    );
  }

  const pretty: IPreprocessorConfiguration["pretty"] = {
    enabled:
      overrides.prettyEnabled ??
      specific?.pretty?.enabled ??
      unspecific.pretty?.enabled ??
      usingPrettyReporter,
  };

  const filterSpecsMixedMode: IPreprocessorConfiguration["filterSpecsMixedMode"] =
    overrides.filterSpecsMixedMode ??
    specific?.filterSpecsMixedMode ??
    unspecific.filterSpecsMixedMode ??
    "hide";

  const filterSpecs: IPreprocessorConfiguration["filterSpecs"] =
    overrides.filterSpecs ??
    specific?.filterSpecs ??
    unspecific.filterSpecs ??
    false;

  const omitFiltered: IPreprocessorConfiguration["omitFiltered"] =
    overrides.omitFiltered ??
    specific?.omitFiltered ??
    unspecific.omitFiltered ??
    false;

  const dryRun: IPreprocessorConfiguration["dryRun"] =
    overrides.dryRun ?? specific?.dryRun ?? unspecific.dryRun ?? false;

  const isTrackingState =
    (cypress.isTextTerminal ?? false) &&
    (messages.enabled ||
      json.enabled ||
      html.enabled ||
      pretty.enabled ||
      usage.enabled ||
      usingPrettyReporter);

  const attachments: IPreprocessorConfiguration["attachments"] = {
    addScreenshots:
      overrides.attachmentsAddScreenshots ??
      specific?.attachments?.addScreenshots ??
      unspecific.attachments?.addScreenshots ??
      true,
    addVideos:
      overrides.attachmentsAddVideos ??
      specific?.attachments?.addVideos ??
      unspecific.attachments?.addVideos ??
      false,
  };

  return {
    stepDefinitions,
    state,
    messages,
    json,
    html,
    pretty,
    usage,
    filterSpecsMixedMode,
    filterSpecs,
    omitFiltered,
    implicitIntegrationFolder,
    isTrackingState,
    dryRun,
    attachments,
  };
}

async function cosmiconfigResolver(projectRoot: string) {
  const result = await cosmiconfig("cypress-cucumber-preprocessor", {
    searchStrategy: "project",
  }).search(projectRoot);

  return result?.config;
}

export type ConfigurationFileResolver = (
  projectRoot: string,
) => unknown | Promise<unknown>;

export async function resolve(
  cypressConfig: ICypressRuntimeConfiguration,
  environment: Record<string, unknown>,
  implicitIntegrationFolder: string,
  configurationFileResolver: ConfigurationFileResolver = cosmiconfigResolver,
): Promise<IPreprocessorConfiguration> {
  const result = await configurationFileResolver(cypressConfig.projectRoot);

  const environmentOverrides = decode(EnvironmentOverrides, environment);

  debug(`resolved environment overrides ${util.inspect(environmentOverrides)}`);

  let explicitConfiguration: IUserConfiguration;

  if (result) {
    explicitConfiguration = decode(UserConfiguration, result);

    debug(
      `resolved explicit user configuration ${util.inspect(
        explicitConfiguration,
      )}`,
    );
  } else {
    explicitConfiguration = {};

    debug("resolved no explicit user configuration");
  }

  const configuration = combineIntoConfiguration(
    explicitConfiguration,
    environmentOverrides,
    cypressConfig,
    implicitIntegrationFolder,
  );

  debug(`resolved configuration ${util.inspect(configuration)}`);

  return configuration;
}
