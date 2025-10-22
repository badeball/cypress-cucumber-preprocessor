#!/usr/bin/env node

import stream from "node:stream/promises";

import { NdjsonToMessageStream } from "@cucumber/message-streams";

import { createHtmlStream } from "../helpers/formatters";

stream
  .pipeline(
    process.stdin,
    new NdjsonToMessageStream(),
    createHtmlStream(),
    process.stdout,
  )
  .catch((err) => {
    console.error(err.stack);
    process.exitCode = 1;
  });
