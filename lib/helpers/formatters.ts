import { EventEmitter } from "node:events";

import {
  formatterHelpers,
  JsonFormatter,
  UsageFormatter,
} from "@cucumber/cucumber";
import type { CucumberHtmlStream } from "@cucumber/html-formatter";
import type * as messages from "@cucumber/messages";
import { PrettyPrinter } from "@cucumber/pretty-formatter";

import { assertIsString } from "./assertions";
import { notNull } from "./type-guards";

export async function createHtmlStream(): Promise<CucumberHtmlStream> {
  /**
   * Import this dynamically to circumvent tsx from rewriting this module to CJS. The tsx version
   * bundled with Cypress from v15.0.0 to v15.16.0 doesn't populate import.meta.dirname or
   * import.meta.filename, which prevents this module from working properly.
   *
   * https://github.com/cypress-io/cypress/issues/35351
   * https://github.com/badeball/cypress-cucumber-preprocessor/issues/1372
   * https://github.com/privatenumber/tsx/issues/781
   */
  const { CucumberHtmlStream } = await import("@cucumber/html-formatter");

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
