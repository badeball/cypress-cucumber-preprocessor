import { EventEmitter } from "events";

import { CucumberHtmlStream } from "@cucumber/html-formatter";

import PrettyFormatter from "@cucumber/pretty-formatter";

import {
  formatterHelpers,
  JsonFormatter,
  UsageFormatter,
} from "@cucumber/cucumber";

import type * as messages from "@cucumber/messages";

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
  log: (chunk: string) => void,
): EventEmitter {
  const eventBroadcaster = new EventEmitter();

  PrettyFormatter.formatter({
    on: eventBroadcaster.on.bind(eventBroadcaster),
    write: log,
    // To detect colors
    stream: process.stdout,
  });

  return eventBroadcaster;
}
