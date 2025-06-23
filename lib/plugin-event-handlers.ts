import syncFs, { promises as fs } from "fs";

import os from "os";

import path from "path";

import { pipeline } from "stream/promises";

import stream from "stream";

import { EventEmitter } from "events";

import chalk from "chalk";

import * as messages from "@cucumber/messages";

import detectCiEnvironment from "@cucumber/ci-environment";

import split from "split";

import { HOOK_FAILURE_EXPR } from "./constants";

import {
  ITaskSpecEnvelopes,
  ITaskCreateStringAttachment,
  ITaskTestCaseStarted,
  ITaskTestStepStarted,
  ITaskTestStepFinished,
  ITaskTestCaseFinished,
} from "./cypress-task-definitions";

import { resolve as origResolve } from "./preprocessor-configuration";

import { ensureIsAbsolute } from "./helpers/paths";

import {
  createTimestamp,
  removeDuplicatedStepDefinitions,
} from "./helpers/messages";

import { memoize } from "./helpers/memoize";

import debug from "./helpers/debug";

import { CypressCucumberError, createError, homepage } from "./helpers/error";

import { assert, assertAndReturn, assertIsString } from "./helpers/assertions";

import {
  createHtmlStream,
  createJsonFormatter,
  createPrettyFormatter,
  createUsageFormatter,
} from "./helpers/formatters";

import { useColors } from "./helpers/colors";

import { notNull } from "./helpers/type-guards";

import { indent } from "./helpers/strings";

import { version as packageVersion } from "./version";

import { IStepHookParameter } from "./public-member-types";

const resolve = memoize(origResolve);

interface PrettyDisabled {
  enabled: false;
}

interface PrettyEnabled {
  enabled: true;
  broadcaster: EventEmitter;
  writable: stream.Writable;
}

type PrettyState = PrettyDisabled | PrettyEnabled;

interface StateUninitialized {
  state: "uninitialized";
}

interface StateBeforeRun {
  state: "before-run";
  pretty: PrettyState;
  messages: {
    accumulation: messages.Envelope[];
  };
}

interface StateBeforeSpec {
  state: "before-spec";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
  };
}

interface StateReceivedSpecEnvelopes {
  state: "received-envelopes";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
}

interface StateTestStarted {
  state: "test-started";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
  testCaseStartedId: string;
}

interface StateStepStarted {
  state: "step-started";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
  testCaseStartedId: string;
  testStepStartedId: string;
}

interface StateStepFinished {
  state: "step-finished";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
  testCaseStartedId: string;
}

interface StateTestFinished {
  state: "test-finished";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
}

interface StateAfterSpec {
  state: "after-spec";
  pretty: PrettyState;
  messages: {
    accumulation: messages.Envelope[];
  };
}

interface StateAfterRun {
  state: "after-run";
  messages: {
    accumulation: messages.Envelope[];
  };
}

interface StateHasReloaded {
  state: "has-reloaded";
  pretty: PrettyState;
  spec: Cypress.Spec;
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
}

interface StateHasReloadedAndReceivedSpecEnvelopes {
  state: "has-reloaded-received-envelopes";
  pretty: PrettyState;
  spec: Cypress.Spec;
  specEnvelopes: messages.Envelope[];
  messages: {
    accumulation: messages.Envelope[];
    current: messages.Envelope[];
  };
}

type State =
  | StateUninitialized
  | StateBeforeRun
  | StateBeforeSpec
  | StateReceivedSpecEnvelopes
  | StateTestStarted
  | StateStepStarted
  | StateStepFinished
  | StateTestFinished
  | StateAfterSpec
  | StateAfterRun
  | StateHasReloaded
  | StateHasReloadedAndReceivedSpecEnvelopes;

let state: State = {
  state: "uninitialized",
};

const isFeature = (spec: Cypress.Spec) => spec.name.endsWith(".feature");

const end = (stream: stream.Writable) =>
  new Promise<void>((resolve) => stream.end(resolve));

const createPrettyStream = () => {
  const line = split(null, null, { trailing: false });

  const indent = new stream.Transform({
    objectMode: true,
    transform(chunk, _, callback) {
      callback(null, chunk.length === 0 ? "" : "  " + chunk);
    },
  });

  const log = new stream.Writable({
    write(chunk, _, callback) {
      console.log(chunk.toString("utf8"));
      callback();
    },
  });

  return stream.compose(line, indent, log);
};

const createStateError = (stateHandler: string, currentState: State["state"]) =>
  new CypressCucumberError(
    `Unexpected state in ${stateHandler}: ${currentState}. This almost always means that you or some other plugin, are overwriting this plugin's event handlers. For more information & workarounds, see https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/event-handlers.md (if neither workaround work, please report at ${homepage})`,
  );

export async function beforeRunHandler(config: Cypress.PluginConfigOptions) {
  debug("beforeRunHandler()");

  const preprocessor = await resolve(config, config.env, "/");

  if (!preprocessor.isTrackingState) {
    return;
  }

  switch (state.state) {
    case "uninitialized":
      break;
    default:
      throw createError("Unexpected state in beforeRunHandler: " + state.state);
  }

  // Copied from https://github.com/cucumber/cucumber-js/blob/v10.0.1/src/cli/helpers.ts#L104-L122.
  const meta: messages.Envelope = {
    meta: {
      protocolVersion: messages.version,
      implementation: {
        version: packageVersion,
        name: "@badeball/cypress-cucumber-preprocessor",
      },
      cpu: {
        name: os.arch(),
      },
      os: {
        name: os.platform(),
        version: os.release(),
      },
      runtime: {
        name: "node.js",
        version: process.versions.node,
      },
      ci: detectCiEnvironment(process.env),
    },
  };

  const testRunStarted: messages.Envelope = {
    testRunStarted: {
      timestamp: createTimestamp(),
    },
  };

  let pretty: PrettyState;

  if (preprocessor.pretty.enabled) {
    const writable = createPrettyStream();

    const eventBroadcaster = createPrettyFormatter(useColors(), (chunk) =>
      writable.write(chunk),
    );

    pretty = {
      enabled: true,
      broadcaster: eventBroadcaster,
      writable,
    };
  } else {
    pretty = {
      enabled: false,
    };
  }

  state = {
    state: "before-run",
    pretty,
    messages: {
      accumulation: [meta, testRunStarted],
    },
  };
}

export async function afterRunHandler(config: Cypress.PluginConfigOptions) {
  debug("afterRunHandler()");

  const preprocessor = await resolve(config, config.env, "/");

  if (!preprocessor.isTrackingState) {
    return;
  }

  switch (state.state) {
    case "after-spec": // This is the normal case.
    case "before-run": // This can happen when running only non-feature specs.
      break;
    default:
      throw createError("Unexpected state in afterRunHandler: " + state.state);
  }

  const testRunFinished: messages.Envelope = {
    testRunFinished: {
      /**
       * We're missing a "success" attribute here, but cucumber-js doesn't output it, so I won't.
       * Mostly because I don't want to look into the semantics of it right now.
       */
      timestamp: createTimestamp(),
    } as messages.TestRunFinished,
  };

  if (state.pretty.enabled) {
    await end(state.pretty.writable);
  }

  state = {
    state: "after-run",
    messages: {
      accumulation: state.messages.accumulation.concat(testRunFinished),
    },
  };

  removeDuplicatedStepDefinitions(state.messages.accumulation);

  if (preprocessor.messages.enabled) {
    const messagesPath = ensureIsAbsolute(
      config.projectRoot,
      preprocessor.messages.output,
    );

    await fs.mkdir(path.dirname(messagesPath), { recursive: true });

    await fs.writeFile(
      messagesPath,
      state.messages.accumulation
        .map((message) => JSON.stringify(message))
        .join("\n") + "\n",
    );
  }

  if (preprocessor.json.enabled) {
    const jsonPath = ensureIsAbsolute(
      config.projectRoot,
      preprocessor.json.output,
    );

    await fs.mkdir(path.dirname(jsonPath), { recursive: true });

    let jsonOutput: string | undefined;

    const eventBroadcaster = createJsonFormatter(
      state.messages.accumulation,
      (chunk) => {
        jsonOutput = chunk;
      },
    );

    try {
      for (const message of state.messages.accumulation) {
        eventBroadcaster.emit("envelope", message);
      }
    } catch (e) {
      const message = (messagesOutput: string) =>
        `JsonFormatter failed with an error shown below. This might be a bug, please report at ${homepage} and make sure to attach the messages report in your ticket (${messagesOutput}).\n`;

      if (preprocessor.messages.enabled) {
        console.warn(chalk.yellow(message(preprocessor.messages.output)));
      } else {
        const temporaryMessagesOutput = path.join(
          await fs.mkdtemp(
            path.join(os.tmpdir(), "cypress-cucumber-preprocessor-"),
          ),
          "cucumber-messages.ndjson",
        );

        await fs.writeFile(
          temporaryMessagesOutput,
          state.messages.accumulation
            .map((message) => JSON.stringify(message))
            .join("\n") + "\n",
        );

        console.warn(chalk.yellow(message(temporaryMessagesOutput)));
      }

      throw e;
    }

    assertIsString(
      jsonOutput,
      "Expected JSON formatter to have finished, but it never returned",
    );

    await fs.writeFile(jsonPath, jsonOutput);
  }

  if (preprocessor.html.enabled) {
    const htmlPath = ensureIsAbsolute(
      config.projectRoot,
      preprocessor.html.output,
    );

    await fs.mkdir(path.dirname(htmlPath), { recursive: true });

    const output = syncFs.createWriteStream(htmlPath);

    await pipeline(
      stream.Readable.from(state.messages.accumulation),
      createHtmlStream(),
      output,
    );
  }

  if (preprocessor.usage.enabled) {
    let usageOutput: string | undefined;

    const eventBroadcaster = createUsageFormatter(
      state.messages.accumulation,
      (chunk) => {
        usageOutput = chunk;
      },
    );

    for (const message of state.messages.accumulation) {
      eventBroadcaster.emit("envelope", message);
    }

    assertIsString(
      usageOutput,
      "Expected usage formatter to have finished, but it never returned",
    );

    if (preprocessor.usage.output === "stdout") {
      console.log(indent(usageOutput, { count: 2 }));
    } else {
      const usagePath = ensureIsAbsolute(
        config.projectRoot,
        preprocessor.usage.output,
      );

      await fs.mkdir(path.dirname(usagePath), { recursive: true });

      await fs.writeFile(usagePath, usageOutput);
    }
  }
}

export async function beforeSpecHandler(
  config: Cypress.PluginConfigOptions,
  spec: Cypress.Spec,
) {
  debug("beforeSpecHandler()");

  if (!isFeature(spec)) {
    return;
  }

  const preprocessor = await resolve(config, config.env, "/");

  if (!preprocessor.isTrackingState) {
    return;
  }

  /**
   * Ideally this would only run when current state is either "before-run" or "after-spec". However,
   * reload-behavior means that this is not necessarily true. Reloading can occur in the following
   * scenarios:
   *
   * - before()
   * - beforeEach()
   * - in a step
   * - afterEach()
   * - after()
   *
   * If it happens in the three latter scenarios, the current / previous test will be re-run by
   * Cypress under a new domain. In these cases, messages associated with the latest test will have
   * to be discarded and a "Reloading.." message will appear *if* pretty output is enabled. If that
   * is the case, then the pretty reporter instance will also have re-instantiated and primed with
   * envelopes associated with the current spec.
   *
   * To make matters worse, it's impossible in this handler to determine of a reload occurs due to
   * a beforeEach hook or an afterEach hook. In the latter case, messages must be discarded. This is
   * however not true for the former case.
   */
  switch (state.state) {
    case "before-run":
    case "after-spec":
      state = {
        state: "before-spec",
        spec,
        pretty: state.pretty,
        messages: state.messages,
      };
      return;
  }

  // This will be the case for reloads occurring in a before(), in which case we do nothing,
  // because "received-envelopes" would anyway be the next natural state.
  if (state.state === "before-spec") {
    return;
  }

  switch (state.state) {
    case "received-envelopes": // This will be the case for reloading occurring in a beforeEach().
    case "step-started": // This will be the case for reloading occurring in a step.
    case "test-finished": // This will be the case for reloading occurring in any after-ish hook (and possibly beforeEach).
      if (state.spec.relative === spec.relative) {
        state = {
          state: "has-reloaded",
          spec: spec,
          pretty: state.pretty,
          messages: state.messages,
        };
        return;
      }
    // eslint-disable-next-line no-fallthrough
    default:
      throw createStateError("beforeSpecHandler", state.state);
  }
}

export async function afterSpecHandler(
  config: Cypress.PluginConfigOptions,
  spec: Cypress.Spec,
  results: CypressCommandLine.RunResult,
) {
  debug("afterSpecHandler()");

  if (!isFeature(spec)) {
    return;
  }

  const preprocessor = await resolve(config, config.env, "/");

  if (!preprocessor.isTrackingState) {
    return;
  }

  /**
   * This pretty much can't happen and the check is merely to satisfy TypeScript in the next block.
   */
  switch (state.state) {
    case "uninitialized":
    case "after-run":
      throw createError("Unexpected state in afterSpecHandler: " + state.state);
  }

  const browserCrashExprCol = [
    /We detected that the .+ process just crashed/,
    /We detected that the .+ Renderer process just crashed/,
  ];

  const error = results.error;

  if (error != null && browserCrashExprCol.some((expr) => expr.test(error))) {
    console.log(
      chalk.yellow(
        `\nDue to browser crash, no reports are created for ${spec.relative}.`,
      ),
    );

    state = {
      state: "after-spec",
      pretty: state.pretty,
      messages: {
        accumulation: state.messages.accumulation,
      },
    };

    return;
  }

  switch (state.state) {
    case "test-finished": // This is the normal case.
    case "before-spec": // This can happen if a spec doesn't contain any tests.
    case "received-envelopes": // This can happen in case of a failing beforeEach hook.
      break;
    default:
      throw createError("Unexpected state in afterSpecHandler: " + state.state);
  }

  // `results` is undefined when running via `cypress open`.
  // However, `isTrackingState` is never true in open-mode, thus this should be defined.
  assert(results, "Expected results to be defined");

  const wasRemainingSkipped = results.tests.some((test) =>
    test.displayError?.match(HOOK_FAILURE_EXPR),
  );

  if (wasRemainingSkipped) {
    console.log(
      chalk.yellow(
        `  Hook failures can't be represented in any reports (messages / json / html), thus none is created for ${spec.relative}.`,
      ),
    );

    state = {
      state: "after-spec",
      pretty: state.pretty,
      messages: {
        accumulation: state.messages.accumulation,
      },
    };
  } else {
    if (state.state === "before-spec") {
      // IE. the spec didn't contain any tests.
      state = {
        state: "after-spec",
        pretty: state.pretty,
        messages: {
          accumulation: state.messages.accumulation,
        },
      };
    } else {
      // The spec did contain tests.
      state = {
        state: "after-spec",
        pretty: state.pretty,
        messages: {
          accumulation: state.messages.accumulation.concat(
            state.messages.current,
          ),
        },
      };
    }
  }
}

export async function afterScreenshotHandler(
  config: Cypress.PluginConfigOptions,
  details: Cypress.ScreenshotDetails,
) {
  debug("afterScreenshotHandler()");

  const preprocessor = await resolve(config, config.env, "/");

  if (
    !preprocessor.isTrackingState ||
    !preprocessor.attachments.addScreenshots
  ) {
    return details;
  }

  switch (state.state) {
    case "step-started":
      break;
    default:
      return details;
  }

  let buffer;

  try {
    buffer = await fs.readFile(details.path);
  } catch {
    return details;
  }

  const message: messages.Envelope = {
    attachment: {
      testCaseStartedId: state.testCaseStartedId,
      testStepId: state.testStepStartedId,
      body: buffer.toString("base64"),
      mediaType: "image/png",
      contentEncoding:
        "BASE64" as unknown as messages.AttachmentContentEncoding.BASE64,
    },
  };

  state.messages.current.push(message);

  return details;
}

export async function specEnvelopesHandler(
  config: Cypress.PluginConfigOptions,
  data: ITaskSpecEnvelopes,
) {
  debug("specEnvelopesHandler()");

  switch (state.state) {
    case "before-spec":
      break;
    case "has-reloaded":
      state = {
        state: "has-reloaded-received-envelopes",
        spec: state.spec,
        specEnvelopes: data.messages,
        pretty: state.pretty,
        messages: state.messages,
      };

      return true;
    default:
      throw createStateError("specEnvelopesHandler", state.state);
  }

  if (state.pretty.enabled) {
    for (const message of data.messages) {
      state.pretty.broadcaster.emit("envelope", message);
    }
  }

  state = {
    state: "received-envelopes",
    spec: state.spec,
    pretty: state.pretty,
    messages: {
      accumulation: state.messages.accumulation,
      current: data.messages,
    },
  };

  return true;
}

export async function testCaseStartedHandler(
  config: Cypress.PluginConfigOptions,
  data: ITaskTestCaseStarted,
) {
  debug("testCaseStartedHandler()");

  switch (state.state) {
    case "received-envelopes":
    case "test-finished":
      break;
    case "has-reloaded-received-envelopes":
      {
        const iLastTestCaseStarted = state.messages.current.findLastIndex(
          (message) => message.testCaseStarted,
        );

        const lastTestCaseStarted =
          iLastTestCaseStarted > -1
            ? state.messages.current[iLastTestCaseStarted]
            : undefined;

        // A test is being re-run.
        if (lastTestCaseStarted?.testCaseStarted!.id === data.id) {
          if (state.pretty.enabled) {
            await end(state.pretty.writable);

            // Reloading occurred right within a step, so we output an extra newline.
            if (
              state.messages.current[state.messages.current.length - 1]
                .testStepStarted != null
            ) {
              console.log();
            }

            console.log("  Reloading..");
            console.log();

            const writable = createPrettyStream();

            const broadcaster = createPrettyFormatter(useColors(), (chunk) =>
              writable.write(chunk),
            );

            for (const message of state.specEnvelopes) {
              broadcaster.emit("envelope", message);
            }

            state.pretty = {
              enabled: true,
              writable,
              broadcaster,
            };
          }

          // Discard messages of previous test, which is being re-run.
          state.messages.current = state.messages.current.slice(
            0,
            iLastTestCaseStarted,
          );
        }
      }
      break;
    default:
      throw createStateError("testCaseStartedHandler", state.state);
  }

  if (state.pretty.enabled) {
    state.pretty.broadcaster.emit("envelope", {
      testCaseStarted: data,
    });
  }

  state = {
    state: "test-started",
    spec: state.spec,
    pretty: state.pretty,
    messages: {
      accumulation: state.messages.accumulation,
      current: state.messages.current.concat({ testCaseStarted: data }),
    },
    testCaseStartedId: data.id,
  };

  return true;
}

export function testStepStartedHandler(
  config: Cypress.PluginConfigOptions,
  data: ITaskTestStepStarted,
) {
  debug("testStepStartedHandler()");

  switch (state.state) {
    case "test-started":
    case "step-finished":
      break;
    // This state can happen in cases where an error is "rescued".
    case "step-started":
      break;
    default:
      throw createStateError("testStepStartedHandler", state.state);
  }

  if (state.pretty.enabled) {
    state.pretty.broadcaster.emit("envelope", {
      testStepStarted: data,
    });
  }

  state = {
    state: "step-started",
    spec: state.spec,
    pretty: state.pretty,
    messages: {
      accumulation: state.messages.accumulation,
      current: state.messages.current.concat({ testStepStarted: data }),
    },
    testCaseStartedId: state.testCaseStartedId,
    testStepStartedId: data.testStepId,
  };

  return true;
}

export type Attach = (data: string | Buffer, mediaType?: string) => void;

export type OnAfterStep = (
  options: {
    attach: Attach;
    result: messages.TestStepResult;
  } & IStepHookParameter,
) => Promise<void> | void;

export async function testStepFinishedHandler(
  config: Cypress.PluginConfigOptions,
  options: { onAfterStep?: OnAfterStep },
  testStepFinished: ITaskTestStepFinished,
) {
  debug("testStepFinishedHandler()");

  switch (state.state) {
    case "step-started":
      break;
    default:
      throw createStateError("testStepFinishedHandler", state.state);
  }

  if (state.pretty.enabled) {
    state.pretty.broadcaster.emit("envelope", {
      testStepFinished,
    });
  }

  const { testCaseStartedId, testStepId } = testStepFinished;

  const { testCaseId: pickleId } = assertAndReturn(
    state.messages.current
      .map((message) => message.testCaseStarted)
      .filter(notNull)
      .find((testCaseStarted) => testCaseStarted.id === testCaseStartedId),
    "Expected to find a testCaseStarted",
  );

  const testCase = assertAndReturn(
    state.messages.current
      .map((message) => message.testCase)
      .filter(notNull)
      .find((testCase) => testCase.id === pickleId),
    "Expected to find a testCase",
  );

  const { pickleStepId, hookId } = assertAndReturn(
    testCase.testSteps.find((testStep) => testStep.id === testStepId),
    "Expected to find a testStep",
  );

  if (pickleStepId != null) {
    const pickle = assertAndReturn(
      state.messages.current
        .map((message) => message.pickle)
        .filter(notNull)
        .find((pickle) => pickle.id === pickleId),
      "Expected to find a pickle",
    );

    const pickleStep = assertAndReturn(
      pickle.steps.find((step) => step.id === pickleStepId),
      "Expected to find a pickleStep",
    );

    const gherkinDocument = assertAndReturn(
      state.messages.current
        .map((message) => message.gherkinDocument)
        .filter(notNull)
        .find((gherkinDocument) => gherkinDocument.uri === pickle.uri),
      "Expected to find a gherkinDocument",
    );

    const attachments: ITaskCreateStringAttachment[] = [];

    await options.onAfterStep?.({
      result: testStepFinished.testStepResult,
      pickle,
      pickleStep,
      gherkinDocument,
      testCaseStartedId,
      testStepId,
      attach(data, mediaType) {
        if (typeof data === "string") {
          mediaType = mediaType ?? "text/plain";

          if (mediaType.startsWith("base64:")) {
            attachments.push({
              data,
              mediaType: mediaType.replace("base64:", ""),
              encoding: messages.AttachmentContentEncoding.BASE64,
            });
          } else {
            attachments.push({
              data,
              mediaType: mediaType ?? "text/plain",
              encoding: messages.AttachmentContentEncoding.IDENTITY,
            });
          }
        } else if (data instanceof Buffer) {
          if (typeof mediaType !== "string") {
            throw Error("Buffer attachments must specify a media type");
          }

          attachments.push({
            data: data.toString("base64"),
            mediaType,
            encoding: messages.AttachmentContentEncoding.BASE64,
          });
        } else {
          throw Error("Invalid attachment data: must be a Buffer or string");
        }
      },
    });

    for (const attachment of attachments) {
      await createStringAttachmentHandler(config, attachment);
    }
  } else {
    assert(hookId != null, "Expected a hookId in absence of pickleStepId");
  }

  state = {
    state: "step-finished",
    spec: state.spec,
    pretty: state.pretty,
    messages: {
      accumulation: state.messages.accumulation,
      current: state.messages.current.concat({ testStepFinished }),
    },
    testCaseStartedId: state.testCaseStartedId,
  };

  return true;
}

export function testCaseFinishedHandler(
  config: Cypress.PluginConfigOptions,
  data: ITaskTestCaseFinished,
) {
  debug("testCaseFinishedHandler()");

  switch (state.state) {
    case "test-started":
    case "step-finished":
      break;
    default:
      throw createStateError("testCaseFinishedHandler", state.state);
  }

  if (state.pretty.enabled) {
    state.pretty.broadcaster.emit("envelope", {
      testCaseFinished: data,
    });
  }

  state = {
    state: "test-finished",
    spec: state.spec,
    pretty: state.pretty,
    messages: {
      accumulation: state.messages.accumulation,
      current: state.messages.current.concat({ testCaseFinished: data }),
    },
  };

  return true;
}

export async function createStringAttachmentHandler(
  config: Cypress.PluginConfigOptions,
  { data, mediaType, encoding }: ITaskCreateStringAttachment,
) {
  debug("createStringAttachmentHandler()");

  const preprocessor = await resolve(config, config.env, "/");

  if (!preprocessor.isTrackingState) {
    return true;
  }

  switch (state.state) {
    case "step-started":
      break;
    default:
      throw createStateError("createStringAttachmentHandler", state.state);
  }

  const message: messages.Envelope = {
    attachment: {
      testCaseStartedId: state.testCaseStartedId,
      testStepId: state.testStepStartedId,
      body: data,
      mediaType: mediaType,
      contentEncoding: encoding,
    },
  };

  state.messages.current.push(message);

  return true;
}
