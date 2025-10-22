import type * as messages from "@cucumber/messages";

import { TEST_ISOLATION_CONFIGURATION_OPTION } from "../constants";
import { collectTagNames } from "./ast";
import {
  ConfigurationEntry,
  looksLikeOptions,
  tagToCypressOptions,
} from "./tag-parser";

export function tagsToOptions(tags: readonly messages.Tag[]) {
  return collectTagNames(tags)
    .filter(looksLikeOptions)
    .map(tagToCypressOptions);
}

export function isExclusivelySuiteConfiguration(entry: ConfigurationEntry) {
  // TODO: Remove type cast once support for v10 is removed.
  return entry[0] === (TEST_ISOLATION_CONFIGURATION_OPTION as string);
}

export function isNotExclusivelySuiteConfiguration(entry: ConfigurationEntry) {
  // TODO: Remove type cast once support for v10 is removed.
  return entry[0] !== (TEST_ISOLATION_CONFIGURATION_OPTION as string);
}

export function hasExclusivelySuiteConfiguration(
  config: Cypress.TestConfigOverrides,
) {
  return Object.keys(config).includes(TEST_ISOLATION_CONFIGURATION_OPTION);
}
