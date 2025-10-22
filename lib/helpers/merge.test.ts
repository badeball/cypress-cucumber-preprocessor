import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { WritableStreamBuffer } from "stream-buffers";

import { stringToNdJson } from "../../features/support/helpers";
import { mergeMessagesArgs } from "./merge";

// TODO: Implement these.
describe.skip("mergeMessages()", () => {
  it("should select the first meta", () => {});

  it("should select the earliest testRunStarted", () => {});

  it("should select the latest testRunFinished", () => {});

  it("it should fail upon merging unrelated reports", () => {});

  it("it should fail upon receiving zero reports", () => {});
});

describe("mergeMessagesArgs()", () => {
  it("should merge two, basic and unrelated reports", async () => {
    const stdout = new WritableStreamBuffer();

    await mergeMessagesArgs({
      stdout,
      argv: [
        "/usr/bin/node",
        "./node_modules/.bin/merge-messages",
        "features/fixtures/passed-example.ndjson",
        "features/fixtures/another-passed-example.ndjson",
      ],
    });

    const actual = stringToNdJson(stdout.getContentsAsString() || "");

    const expected = stringToNdJson(
      (
        await fs.readFile("features/fixtures/multiple-features.ndjson")
      ).toString(),
    );

    assert.deepEqual(actual, expected);
  });
});
