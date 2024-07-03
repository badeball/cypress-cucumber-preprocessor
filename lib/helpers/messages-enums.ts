export enum PickleStepType {
  UNKNOWN = "Unknown",
  CONTEXT = "Context",
  ACTION = "Action",
  OUTCOME = "Outcome",
}

export enum AttachmentContentEncoding {
  IDENTITY = "IDENTITY",
  BASE64 = "BASE64",
}

export enum StepDefinitionPatternType {
  CUCUMBER_EXPRESSION = "CUCUMBER_EXPRESSION",
  REGULAR_EXPRESSION = "REGULAR_EXPRESSION",
}

export enum TestStepResultStatus {
  UNKNOWN = "UNKNOWN",
  PASSED = "PASSED",
  SKIPPED = "SKIPPED",
  PENDING = "PENDING",
  UNDEFINED = "UNDEFINED",
  AMBIGUOUS = "AMBIGUOUS",
  FAILED = "FAILED",
}

export enum SourceMediaType {
  TEXT_X_CUCUMBER_GHERKIN_PLAIN = "text/x.cucumber.gherkin+plain",
  TEXT_X_CUCUMBER_GHERKIN_MARKDOWN = "text/x.cucumber.gherkin+markdown",
}

export enum HookType {
  BEFORE_TEST_RUN = "BEFORE_TEST_RUN",
  AFTER_TEST_RUN = "AFTER_TEST_RUN",
  BEFORE_TEST_CASE = "BEFORE_TEST_CASE",
  AFTER_TEST_CASE = "AFTER_TEST_CASE",
  BEFORE_TEST_STEP = "BEFORE_TEST_STEP",
  AFTER_TEST_STEP = "AFTER_TEST_STEP",
}
