import util from "util";

import assert from "assert/strict";

import {
  ICypressRuntimeConfiguration,
  IUserConfiguration,
  combineIntoConfiguration,
} from "./preprocessor-configuration";

import { getStepDefinitionPatterns, pathParts } from "./step-definitions";

const DUMMY_CONFIG: ICypressRuntimeConfiguration = {
  testingType: "e2e",
  projectRoot: "",
  reporter: "spec",
  specPattern: [],
  excludeSpecPattern: [],
  env: {},
  isTextTerminal: false,
};

function example(
  filepath: string,
  partialCypressConfiguration: Partial<ICypressRuntimeConfiguration>,
  preprocessorConfiguration: IUserConfiguration,
  implicitIntegrationFolder: string,
  expected: string[],
) {
  const cypressConfiguration: ICypressRuntimeConfiguration = {
    ...DUMMY_CONFIG,
    ...partialCypressConfiguration,
  };

  it(`should return [${expected.join(
    ", ",
  )}] for ${filepath} with ${util.inspect(preprocessorConfiguration)} in ${
    cypressConfiguration.projectRoot
  }`, () => {
    const actual = getStepDefinitionPatterns(
      combineIntoConfiguration(
        preprocessorConfiguration,
        {},
        cypressConfiguration,
        implicitIntegrationFolder,
      ),
      filepath,
    );

    const throwUnequal = () => {
      throw new Error(
        `Expected ${util.inspect(expected)}, but got ${util.inspect(actual)}`,
      );
    };

    if (expected.length !== actual.length) {
      throwUnequal();
    }

    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        throwUnequal();
      }
    }
  });
}

describe("pathParts()", () => {
  const relativePath = "foo/bar/baz";
  const expectedParts = ["foo/bar/baz", "foo/bar", "foo"];

  it(`should return ${util.inspect(expectedParts)} for ${util.inspect(
    relativePath,
  )}`, () => {
    assert.deepEqual(pathParts(relativePath), expectedParts);
  });
});

describe("getStepDefinitionPatterns()", () => {
  example(
    "/foo/bar/cypress/e2e/baz.feature",
    {
      projectRoot: "/foo/bar",
    },
    {},
    "/foo/bar/cypress/e2e",
    [
      "cypress/e2e/baz/**/*.{js,mjs,ts,tsx}",
      "cypress/e2e/baz.{js,mjs,ts,tsx}",
      "cypress/support/step_definitions/**/*.{js,mjs,ts,tsx}",
    ],
  );

  example(
    "/cypress/e2e/foo/bar/baz.feature",
    {
      projectRoot: "/",
    },
    {
      stepDefinitions: "cypress/e2e/[filepath]/step_definitions/*.ts",
    },
    "/cypress/e2e",
    ["cypress/e2e/foo/bar/baz/step_definitions/*.ts"],
  );

  example(
    "/cypress/e2e/foo/bar/baz.feature",
    {
      projectRoot: "/",
    },
    {
      stepDefinitions: "cypress/e2e/[filepart]/step_definitions/*.ts",
    },
    "/cypress/e2e",
    [
      "cypress/e2e/foo/bar/baz/step_definitions/*.ts",
      "cypress/e2e/foo/bar/step_definitions/*.ts",
      "cypress/e2e/foo/step_definitions/*.ts",
      "cypress/e2e/step_definitions/*.ts",
    ],
  );
});
