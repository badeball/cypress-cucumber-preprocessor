import { EventEmitter } from "node:events";

import { CucumberHtmlStream } from "@cucumber/html-formatter";

import PrettyFormatter from "@cucumber/pretty-formatter";

import {
  formatterHelpers,
  IFormatterOptions,
  JsonFormatter,
  UsageFormatter,
} from "@cucumber/cucumber";

import type * as messages from "@cucumber/messages";

import chalk from "chalk";

import { notNull } from "./type-guards";

import { assertIsString } from "./assertions";

export function createHtmlStream(): CucumberHtmlStream {
  return new CucumberHtmlStream(
    require.resolve("@cucumber/html-formatter/dist/main.css", {
      paths: [__dirname],
    }),
    require.resolve("@cucumber/html-formatter/dist/main.js", {
      paths: [__dirname],
    }),
  );
}

export function createJsonFormatter(
  envelopes: messages.Envelope[],
  log: (chunk: string) => void,
): EventEmitter {
  const eventBroadcaster = new EventEmitter();

  const eventDataCollector = new formatterHelpers.EventDataCollector(
    eventBroadcaster,
  );

  const stepDefinitions = envelopes
    .map((m) => m.stepDefinition)
    .filter(notNull)
    .map((s) => {
      return {
        id: s.id,
        uri: s.sourceReference.uri,
        line: s.sourceReference.location?.line,
      };
    });

  new JsonFormatter({
    eventBroadcaster,
    eventDataCollector,
    log(chunk) {
      assertIsString(
        chunk,
        "Expected a JSON output of string, but got " + typeof chunk,
      );
      log(chunk);
    },
    supportCodeLibrary: {
      stepDefinitions,
    } as any,
    colorFns: null as any,
    cwd: null as any,
    parsedArgvOptions: {},
    snippetBuilder: null as any,
    stream: null as any,
    cleanup: null as any,
  });

  return eventBroadcaster;
}

export function createUsageFormatter(
  envelopes: messages.Envelope[],
  log: (chunk: string) => void,
): EventEmitter {
  const eventBroadcaster = new EventEmitter();

  const eventDataCollector = new formatterHelpers.EventDataCollector(
    eventBroadcaster,
  );

  const stepDefinitions = envelopes
    .map((m) => m.stepDefinition)
    .filter(notNull)
    .map((s) => {
      return {
        id: s.id,
        uri: s.sourceReference.uri,
        line: s.sourceReference.location?.line,
        unwrappedCode: "",
        expression: {
          source: s.pattern.source,
          constructor: {
            name: "foo",
          },
        },
      };
    });

  new UsageFormatter({
    eventBroadcaster,
    eventDataCollector,
    log(chunk) {
      assertIsString(
        chunk,
        "Expected a JSON output of string, but got " + typeof chunk,
      );
      log(chunk);
    },
    supportCodeLibrary: {
      stepDefinitions,
    } as any,
    colorFns: null as any,
    cwd: null as any,
    parsedArgvOptions: {},
    snippetBuilder: null as any,
    stream: null as any,
    cleanup: null as any,
  });

  return eventBroadcaster;
}

export function createPrettyFormatter(
  useColors: boolean,
  log: (chunk: string) => void,
): EventEmitter {
  const eventBroadcaster = new EventEmitter();

  const eventDataCollector = new formatterHelpers.EventDataCollector(
    eventBroadcaster,
  );

  const colorFns: IFormatterOptions["colorFns"] = useColors
    ? {
        forStatus(status: messages.TestStepResultStatus) {
          return {
            AMBIGUOUS: chalk.red.bind(chalk),
            FAILED: chalk.red.bind(chalk),
            PASSED: chalk.green.bind(chalk),
            PENDING: chalk.yellow.bind(chalk),
            SKIPPED: chalk.cyan.bind(chalk),
            UNDEFINED: chalk.yellow.bind(chalk),
            UNKNOWN: chalk.yellow.bind(chalk),
          }[status];
        },
        location: chalk.gray.bind(chalk),
        tag: chalk.cyan.bind(chalk),
        diffAdded: chalk.green.bind(chalk),
        diffRemoved: chalk.red.bind(chalk),
        errorMessage: chalk.red.bind(chalk),
        errorStack: chalk.grey.bind(chalk),
      }
    : {
        forStatus() {
          return (x) => x;
        },
        location: (x) => x,
        tag: (x) => x,
        diffAdded: (x) => x,
        diffRemoved: (x) => x,
        errorMessage: (x) => x,
        errorStack: (x) => x,
      };

  new PrettyFormatter({
    eventBroadcaster,
    eventDataCollector,
    log(chunk) {
      assertIsString(
        chunk,
        "Expected a JSON output of string, but got " + typeof chunk,
      );
      log(chunk);
    },
    supportCodeLibrary: null as any,
    colorFns,
    cwd: null as any,
    parsedArgvOptions: {
      colorsEnabled: useColors,
    },
    snippetBuilder: null as any,
    stream: null as any,
    cleanup: null as any,
  });

  return eventBroadcaster;
}
