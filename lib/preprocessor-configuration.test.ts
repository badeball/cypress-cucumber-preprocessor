import assert from "assert";

import {
  COMPILED_REPORTER_ENTRYPOINT,
  FilterSpecsMixedMode,
  IBaseUserConfiguration,
  ICypressRuntimeConfiguration,
  IPreprocessorConfiguration,
  IUserConfiguration,
  resolve,
} from "./preprocessor-configuration";

const DUMMY_POST10_CONFIG: Omit<ICypressRuntimeConfiguration, "testingType"> = {
  projectRoot: "",
  reporter: "spec",
  specPattern: [],
  excludeSpecPattern: [],
  env: {},
  isTextTerminal: false,
};

type GetValueFn<T> = (configuration: IPreprocessorConfiguration) => T;

type SetValueFn<T> = (configuration: IBaseUserConfiguration, value: T) => void;

async function test<T>(options: {
  testingType: ICypressRuntimeConfiguration["testingType"];
  environment: Record<string, unknown>;
  configuration: IUserConfiguration;
  cypressConfiguration?: Partial<ICypressRuntimeConfiguration>;
  expectedValue: T;
  getValueFn: GetValueFn<T>;
}) {
  const configuration = await resolve(
    Object.assign(
      { testingType: options.testingType },
      DUMMY_POST10_CONFIG,
      options.cypressConfiguration,
    ),
    options.environment,
    "cypress/e2e",
    () => options.configuration,
  );

  assert.deepStrictEqual(
    options.getValueFn(configuration),
    options.expectedValue,
  );
}

function createUserConfiguration<T>(options: {
  setValueFn: SetValueFn<T>;
  value: T;
}): IBaseUserConfiguration {
  const configuration: IBaseUserConfiguration = {};
  options.setValueFn(configuration, options.value);
  return configuration;
}

function basicBooleanExample(options: {
  testingType: ICypressRuntimeConfiguration["testingType"];
  default: boolean;
  environmentKey: string;
  setValueFn: SetValueFn<boolean>;
  getValueFn: GetValueFn<boolean>;
}) {
  const { testingType, environmentKey, setValueFn, getValueFn } = options;

  it("default", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {},
      expectedValue: options.default,
    }));

  it("override by explicit, type-unspecific configuration (boolean)", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: createUserConfiguration({ setValueFn, value: true }),
      expectedValue: true,
    }));

  it("override by explicit, type-specific configuration (boolean)", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: true }),
      },
      expectedValue: true,
    }));

  it("override by environment (boolean)", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: true },
      configuration: {},
      expectedValue: true,
    }));

  it("precedence (environment over explicit, type-unspecific)", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: true },
      configuration: createUserConfiguration({ setValueFn, value: false }),
      expectedValue: true,
    }));

  it("precedence (environment over explicit, type-specific)", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: true },
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: false }),
      },
      expectedValue: true,
    }));

  it("precedence (explicit, type-specific over type-unspecific)", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: true }),
        ...createUserConfiguration({ setValueFn, value: false }),
      },
      expectedValue: true,
    }));

  describe("environment string interpretation", () => {
    const matrix = [
      { environmentValue: "true", expectedValue: true },
      { environmentValue: "foobar", expectedValue: true },
      { environmentValue: "0", expectedValue: false },
      { environmentValue: "false", expectedValue: false },
    ];

    for (const { environmentValue, expectedValue } of matrix) {
      it(JSON.stringify(environmentValue), () =>
        test({
          testingType,
          getValueFn,
          environment: { [environmentKey]: environmentValue },
          configuration: createUserConfiguration({
            setValueFn,
            value: !expectedValue,
          }),
          expectedValue: expectedValue,
        }),
      );
    }

    // defers to next value
    it('"" and explicit value', () =>
      test({
        testingType,
        getValueFn,
        environment: { [environmentKey]: "" },
        configuration: createUserConfiguration({
          setValueFn,
          value: true,
        }),
        expectedValue: true,
      }));

    it('"" and no explicit values', () =>
      test({
        testingType,
        getValueFn,
        environment: { [environmentKey]: "" },
        configuration: {},
        expectedValue: options.default,
      }));
  });
}

function basicStringExample(options: {
  testingType: ICypressRuntimeConfiguration["testingType"];
  default: string;
  environmentKey: string;
  setValueFn: SetValueFn<string>;
  getValueFn: GetValueFn<string>;
}) {
  const { testingType, environmentKey, setValueFn, getValueFn } = options;

  it("default", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {},
      expectedValue: options.default,
    }));

  it("override by explicit, type-unspecific configuration", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: createUserConfiguration({ setValueFn, value: "foo" }),
      expectedValue: "foo",
    }));

  it("override by explicit, type-specific configuration", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: "foo" }),
      },
      expectedValue: "foo",
    }));

  it("override by environment", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: "foo" },
      configuration: {},
      expectedValue: "foo",
    }));

  it("precedence (environment over explicit, type-unspecific)", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: "bar" },
      configuration: createUserConfiguration({ setValueFn, value: "foo" }),
      expectedValue: "bar",
    }));

  it("precedence (environment over explicit, type-specific)", () =>
    test({
      testingType,
      getValueFn,
      environment: { [environmentKey]: "bar" },
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: "foo" }),
      },
      expectedValue: "bar",
    }));

  it("precedence (explicit, type-specific over type-unspecific)", () =>
    test({
      testingType,
      getValueFn,
      environment: {},
      configuration: {
        [testingType]: createUserConfiguration({ setValueFn, value: "foo" }),
        ...createUserConfiguration({ setValueFn, value: "bar" }),
      },
      expectedValue: "foo",
    }));
}

describe("resolve()", () => {
  for (const testingType of ["e2e", "component"] as const) {
    describe(testingType, () => {
      describe("stepDefinitions", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): string | string[] => configuration.stepDefinitions;

        const setValueFn = (
          configuration: IBaseUserConfiguration,
          value: string | string[],
        ) => (configuration.stepDefinitions = value);

        it("default", () =>
          test({
            testingType,
            getValueFn,
            environment: {},
            configuration: {},
            expectedValue: [
              "cypress/e2e/[filepath]/**/*.{js,mjs,ts,tsx}",
              "cypress/e2e/[filepath].{js,mjs,ts,tsx}",
              "cypress/support/step_definitions/**/*.{js,mjs,ts,tsx}",
            ],
          }));

        describe("string", () => {
          it("override by explicit, type-unspecific configuration", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: createUserConfiguration({
                setValueFn,
                value: "foo",
              }),
              expectedValue: "foo",
            }));

          it("override by explicit, type-specific configuration", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: "foo",
                }),
              },
              expectedValue: "foo",
            }));

          it("override by environment", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: "foo" },
              configuration: {},
              expectedValue: "foo",
            }));

          it("precedence (environment over explicit, type-unspecific)", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: "bar" },
              configuration: createUserConfiguration({
                setValueFn,
                value: "foo",
              }),
              expectedValue: "bar",
            }));

          it("precedence (environment over explicit, type-specific)", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: "bar" },
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: "foo",
                }),
              },
              expectedValue: "bar",
            }));

          it("precedence (explicit, type-specific over type-unspecific)", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: "foo",
                }),
                ...createUserConfiguration({ setValueFn, value: "bar" }),
              },
              expectedValue: "foo",
            }));
        });

        describe("string[]", () => {
          it("override by explicit, type-unspecific configuration", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: createUserConfiguration({
                setValueFn,
                value: ["foo"],
              }),
              expectedValue: ["foo"],
            }));

          it("override by explicit, type-specific configuration", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: ["foo"],
                }),
              },
              expectedValue: ["foo"],
            }));

          it("override by environment", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: ["foo"] },
              configuration: {},
              expectedValue: ["foo"],
            }));

          it("precedence (environment over explicit, type-unspecific)", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: ["bar"] },
              configuration: createUserConfiguration({
                setValueFn,
                value: ["foo"],
              }),
              expectedValue: ["bar"],
            }));

          it("precedence (environment over explicit, type-specific)", () =>
            test({
              testingType,
              getValueFn,
              environment: { stepDefinitions: ["bar"] },
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: ["foo"],
                }),
              },
              expectedValue: ["bar"],
            }));

          it("precedence (explicit, type-specific over type-unspecific)", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                [testingType]: createUserConfiguration({
                  setValueFn,
                  value: ["foo"],
                }),
                ...createUserConfiguration({ setValueFn, value: ["bar"] }),
              },
              expectedValue: ["foo"],
            }));
        });
      });

      describe("messages", () => {
        describe("enabled", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): boolean => configuration.messages.enabled;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: boolean,
          ) => (configuration.messages = { enabled: value });

          basicBooleanExample({
            testingType,
            default: false,
            environmentKey: "messagesEnabled",
            getValueFn,
            setValueFn,
          });
        });

        describe("output", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): string => configuration.messages.output;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: string,
          ) => (configuration.messages = { enabled: true, output: value });

          basicStringExample({
            testingType,
            default: "cucumber-messages.ndjson",
            environmentKey: "messagesOutput",
            getValueFn,
            setValueFn,
          });
        });
      });

      describe("json", () => {
        describe("enabled", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): boolean => configuration.json.enabled;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: boolean,
          ) => (configuration.json = { enabled: value });

          basicBooleanExample({
            testingType,
            default: false,
            environmentKey: "jsonEnabled",
            getValueFn,
            setValueFn,
          });
        });

        describe("output", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): string => configuration.json.output;

          const setValueFn = (
            configuration: IUserConfiguration,
            value: string,
          ) => (configuration.json = { enabled: true, output: value });

          basicStringExample({
            testingType,
            default: "cucumber-report.json",
            environmentKey: "jsonOutput",
            getValueFn,
            setValueFn,
          });
        });
      });

      describe("html", () => {
        describe("enabled", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): boolean => configuration.html.enabled;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: boolean,
          ) => (configuration.html = { enabled: value });

          basicBooleanExample({
            testingType,
            default: false,
            environmentKey: "htmlEnabled",
            getValueFn,
            setValueFn,
          });
        });

        describe("output", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): string => configuration.html.output;

          const setValueFn = (
            configuration: IUserConfiguration,
            value: string,
          ) => (configuration.html = { enabled: true, output: value });

          basicStringExample({
            testingType,
            default: "cucumber-report.html",
            environmentKey: "htmlOutput",
            getValueFn,
            setValueFn,
          });
        });
      });

      describe("pretty", () => {
        describe("enabled", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): boolean => configuration.pretty.enabled;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: boolean,
          ) => (configuration.pretty = { enabled: value });

          basicBooleanExample({
            testingType,
            default: false,
            environmentKey: "prettyEnabled",
            getValueFn,
            setValueFn,
          });

          it("should detect use of our reporter and enabled pretty output", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {},
              cypressConfiguration: {
                reporter: "/foo/bar/" + COMPILED_REPORTER_ENTRYPOINT,
              },
              expectedValue: true,
            }));
        });
      });

      describe("filterSpecsMixedMode", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): FilterSpecsMixedMode => configuration.filterSpecsMixedMode;

        const setValueFn = (
          configuration: IBaseUserConfiguration,
          value: FilterSpecsMixedMode,
        ) => (configuration.filterSpecsMixedMode = value);

        it("default", () =>
          test({
            testingType,
            getValueFn,
            environment: {},
            configuration: {},
            expectedValue: "hide",
          }));

        it("override by explicit, type-unspecific configuration", () =>
          test({
            testingType,
            getValueFn,
            environment: {},
            configuration: createUserConfiguration({
              setValueFn,
              value: "show",
            }),
            expectedValue: "show",
          }));

        it("override by explicit, type-specific configuration", () =>
          test({
            testingType,
            getValueFn,
            environment: {},
            configuration: {
              [testingType]: createUserConfiguration({
                setValueFn,
                value: "show",
              }),
            },
            expectedValue: "show",
          }));

        it("override by environment", () =>
          test({
            testingType,
            getValueFn,
            environment: { filterSpecsMixedMode: "show" },
            configuration: {},
            expectedValue: "show",
          }));

        it("precedence (environment over explicit, type-unspecific)", () =>
          test({
            testingType,
            getValueFn,
            environment: { filterSpecsMixedMode: "empty-set" },
            configuration: createUserConfiguration({
              setValueFn,
              value: "show",
            }),
            expectedValue: "empty-set",
          }));

        it("precedence (environment over explicit, type-specific)", () =>
          test({
            testingType,
            getValueFn,
            environment: { filterSpecsMixedMode: "empty-set" },
            configuration: {
              [testingType]: createUserConfiguration({
                setValueFn,
                value: "show",
              }),
            },
            expectedValue: "empty-set",
          }));

        it("precedence (explicit, type-specific over type-unspecific)", () =>
          test({
            testingType,
            getValueFn,
            environment: {},
            configuration: {
              [testingType]: createUserConfiguration({
                setValueFn,
                value: "empty-set",
              }),
              ...createUserConfiguration({ setValueFn, value: "show" }),
            },
            expectedValue: "empty-set",
          }));

        it("should fail when configured using non-recognized mode", () =>
          assert.rejects(
            () =>
              resolve(
                Object.assign(
                  { testingType: testingType },
                  DUMMY_POST10_CONFIG,
                ),
                {},
                "cypress/e2e",
                () => ({ filterSpecsMixedMode: "foobar" }),
              ),
            {
              message:
                'Unrecognize filterSpecsMixedMode: \'foobar\' (valid options are "hide", "show" and "empty-set")',
            },
          ));
      });

      describe("filterSpecs", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): boolean => configuration.filterSpecs;

        const setValueFn = (
          configuration: IBaseUserConfiguration,
          value: boolean,
        ) => (configuration.filterSpecs = value);

        basicBooleanExample({
          testingType,
          default: false,
          environmentKey: "filterSpecs",
          getValueFn,
          setValueFn,
        });
      });

      describe("omitFiltered", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): boolean => configuration.omitFiltered;

        const setValueFn = (
          configuration: IBaseUserConfiguration,
          value: boolean,
        ) => (configuration.omitFiltered = value);

        basicBooleanExample({
          testingType,
          default: false,
          environmentKey: "omitFiltered",
          getValueFn,
          setValueFn,
        });
      });

      describe("dryRun", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): boolean => configuration.dryRun;

        const setValueFn = (
          configuration: IBaseUserConfiguration,
          value: boolean,
        ) => (configuration.dryRun = value);

        basicBooleanExample({
          testingType,
          default: false,
          environmentKey: "dryRun",
          getValueFn,
          setValueFn,
        });
      });

      describe("isTrackingState", () => {
        const getValueFn = (
          configuration: IPreprocessorConfiguration,
        ): boolean => configuration.isTrackingState;

        context("with isTextTerminal = true", () => {
          const cypressConfiguration = { isTextTerminal: true };

          it("default", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {},
              cypressConfiguration,
              expectedValue: false,
            }));

          it("enabled by messages.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                messages: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: true,
            }));

          it("enabled by json.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                json: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: true,
            }));

          it("enabled by html.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                html: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: true,
            }));

          it("enabled by pretty.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                pretty: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: true,
            }));

          it("enabled by pretty-reporter", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {},
              cypressConfiguration: {
                ...cypressConfiguration,
                reporter: "/foo/bar/" + COMPILED_REPORTER_ENTRYPOINT,
              },
              expectedValue: true,
            }));

          it("enabled despite !messages.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                messages: {
                  enabled: false,
                },
                json: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: true,
            }));
        });

        context("with isTextTerminal = false", () => {
          const cypressConfiguration = { isTextTerminal: false };

          it("default", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {},
              cypressConfiguration,
              expectedValue: false,
            }));

          it("disabled despite messages.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                messages: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: false,
            }));

          it("disabled despite json.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                json: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: false,
            }));

          it("disabled despite html.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                html: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: false,
            }));

          it("disabled despite pretty.enabled", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {
                pretty: {
                  enabled: true,
                },
              },
              cypressConfiguration,
              expectedValue: false,
            }));

          it("disabled despite pretty-reporter", () =>
            test({
              testingType,
              getValueFn,
              environment: {},
              configuration: {},
              cypressConfiguration: {
                ...cypressConfiguration,
                reporter: "/foo/bar/" + COMPILED_REPORTER_ENTRYPOINT,
              },
              expectedValue: false,
            }));
        });
      });

      describe("attachments", () => {
        describe("addScreenshots", () => {
          const getValueFn = (
            configuration: IPreprocessorConfiguration,
          ): boolean => configuration.attachments.addScreenshots;

          const setValueFn = (
            configuration: IBaseUserConfiguration,
            value: boolean,
          ) => (configuration.attachments = { addScreenshots: value });

          basicBooleanExample({
            testingType,
            default: true,
            environmentKey: "attachmentsAddScreenshots",
            getValueFn,
            setValueFn,
          });
        });
      });
    });
  }
});
