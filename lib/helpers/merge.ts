import fs from "fs/promises";

import type * as messages from "@cucumber/messages";

import { notNull } from "./type-guards";

import {
  StrictTimestamp,
  durationToNanoseconds,
  orderMessages,
} from "./messages";

import { ensure } from "./assertions";

import { CypressCucumberError } from "./error";

function identity<T>(value: T): T {
  return value;
}

function sortByTimestamp<T extends { timestamp: StrictTimestamp }>(
  a: T,
  b: T,
): number {
  return (
    durationToNanoseconds(a.timestamp) - durationToNanoseconds(b.timestamp)
  );
}

export function mergeMessages(
  messagesCols: messages.Envelope[][],
): messages.Envelope[] {
  const messages = messagesCols.flat();

  const sourcesSeen = new Set<string>();

  const sources = messages.map((message) => message.source).filter(notNull);

  for (const { uri } of sources) {
    if (sourcesSeen.has(uri)) {
      throw new CypressCucumberError(
        `Found duplicate sources in collections: ${uri} (this usually means you're trying to merge unrelated reports)"`,
      );
    } else {
      sourcesSeen.add(uri);
    }
  }

  const meta = ensure(
    messages.map((message) => message.meta).find(notNull),
    "Expected to find a meta envelope",
  );

  const testRunStarted = ensure(
    messages
      .map((message) => message.testRunStarted)
      .filter(notNull)
      .sort(sortByTimestamp)
      .find(identity),
    "Expected to find a testRunStarted envelope",
  );

  const testRunFinished = ensure(
    messages
      .map((message) => message.testRunFinished)
      .filter(notNull)
      .sort(sortByTimestamp)
      .findLast(identity),
    "Expected to find a testRunFinished envelope",
  );

  const isPassThroughMessage = (message: messages.Envelope) =>
    message.meta == null &&
    message.testRunStarted == null &&
    message.testRunFinished == null;

  return orderMessages([
    { meta },
    { testRunStarted },
    ...messages.filter(isPassThroughMessage),
    { testRunFinished },
  ]);
}

export async function mergeMessagesFiles(files: string[]): Promise<string> {
  const contents = await Promise.all(files.map((file) => fs.readFile(file)));

  const messages = mergeMessages(
    contents.map((content) =>
      content
        .toString()
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
    ),
  );

  return messages.map((message) => JSON.stringify(message)).join("\n");
}

export async function mergeMessagesArgs(options: {
  argv: string[];
  stdout: NodeJS.WritableStream;
}): Promise<void> {
  const [, , ...files] = options.argv;
  options.stdout.write(await mergeMessagesFiles(files));
}
