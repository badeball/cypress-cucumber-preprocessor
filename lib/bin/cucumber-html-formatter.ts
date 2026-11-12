#!/usr/bin/env node

import stream from "node:stream/promises";

import { NdjsonToMessageStream } from "@cucumber/message-streams";

import { createHtmlStream } from "../helpers/formatters";

async function run() {
  return stream.pipeline(
    process.stdin,
    new NdjsonToMessageStream(),
    await createHtmlStream(),
    process.stdout,
  );
}

run().catch((err) => {
  console.error(err.stack);
  process.exitCode = 1;
});
