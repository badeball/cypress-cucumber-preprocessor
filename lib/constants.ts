export const INTERNAL_PROPERTY_NAME =
  "__cypress_cucumber_preprocessor_dont_use_this";

export const INTERNAL_SPEC_PROPERTIES = INTERNAL_PROPERTY_NAME + "_spec";

export const INTERNAL_SUITE_PROPERTIES = INTERNAL_PROPERTY_NAME + "_suite";

export const EACH_HOOK_FAILURE_EXPR =
  /Because this error occurred during a `[^`]+` hook we are skipping all of the remaining tests\./;

export const ALL_HOOK_FAILURE_EXPR =
  /Because this error occurred during a `[^`]+` hook we are skipping the remaining tests in the current suite:/;

export const TEST_ISOLATION_CONFIGURATION_OPTION = "testIsolation";
