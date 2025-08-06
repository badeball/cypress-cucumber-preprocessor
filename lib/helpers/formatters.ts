import { EventEmitter } from "node:events";

import {
  formatterHelpers,
  JsonFormatter,
  UsageFormatter,
} from "@cucumber/cucumber";
import { CucumberHtmlStream } from "@cucumber/html-formatter";
import type * as messages from "@cucumber/messages";
import { PrettyPrinter } from "@cucumber/pretty-formatter";

import { assertIsString } from "./assertions";
import { notNull } from "./type-guards";

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
  stream: NodeJS.WritableStream,
): EventEmitter {
  const eventBroadcaster = new EventEmitter();

  const printer = new PrettyPrinter({
    stream,
  });

  eventBroadcaster.on("envelope", (envelope) => printer.update(envelope));

  return eventBroadcaster;
}
