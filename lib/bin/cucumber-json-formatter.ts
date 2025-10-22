#!/usr/bin/env node

import { pipeline } from "node:stream/promises";

import { Writable } from "node:stream";

import { NdjsonToMessageStream } from "@cucumber/message-streams";

import type * as messages from "@cucumber/messages";

import { createJsonFormatter } from "../helpers/formatters";

import { assertIsString } from "../helpers/assertions";

const envelopes: messages.Envelope[] = [];

pipeline(
  process.stdin,
  new NdjsonToMessageStream(),
  new Writable({
    objectMode: true,
    write(envelope: messages.Envelope, _: BufferEncoding, callback) {
      envelopes.push(envelope);
      callback();
    },
  }),
)
  .then(() => {
    let jsonOutput: string | undefined;

    const eventBroadcaster = createJsonFormatter(envelopes, (chunk) => {
      jsonOutput = chunk;
    });

    for (const message of envelopes) {
      eventBroadcaster.emit("envelope", message);
    }

    assertIsString(
      jsonOutput,
      "Expected JSON formatter to have finished, but it never returned",
    );

    console.log(jsonOutput);
  })
  .catch((err) => {
    console.error(err.stack);
    process.exitCode = 1;
  });
