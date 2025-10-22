import { Then } from "@cucumber/cucumber";
import messages from "@cucumber/messages";
import path from "path";
import fs from "fs/promises";
import assert from "assert";
import { toByteArray } from "base64-js";
import { PNG } from "pngjs";
import {
  assertAndReturn,
  ndJsonToString,
  prepareMessagesReport,
  stringToNdJson,
} from "../support/helpers";
import ICustomWorld from "../support/ICustomWorld";

async function readMessagesReport(
  cwd: string,
  options: { normalize: boolean } = { normalize: true },
): Promise<messages.Envelope[]> {
  const absoluteMessagesPath = path.join(cwd, "cucumber-messages.ndjson");

  const content = await fs.readFile(absoluteMessagesPath);

  const messages = stringToNdJson(content.toString());

  if (options.normalize) {
    return prepareMessagesReport(messages);
  } else {
    return messages;
  }
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

Then(
  "the messages should only contain a single {string} and a single {string}",
  async function (this: ICustomWorld, a, b) {
    const absoluteMessagesPath = path.join(
      this.tmpDir,
      "cucumber-messages.ndjson",
    );

    const messages = (await fs.readFile(absoluteMessagesPath))
      .toString()
      .trim()
      .split("\n")
      .map((string) => JSON.parse(string));

    const aCount = messages.filter((m) => m[a]).length;
    const bCount = messages.filter((m) => m[b]).length;

    if (aCount !== 1) {
      throw new Error(`Expected to find a single "${a}", but found ${aCount}`);
    }

    if (bCount !== 1) {
      throw new Error(`Expected to find a single "${b}", but found ${bCount}`);
    }
  },
);

Then("there should be no messages report", async function (this: ICustomWorld) {
  await assert.rejects(
    () => fs.readFile(path.join(this.tmpDir, "cucumber-messages.ndjson")),
    {
      code: "ENOENT",
    },
    "Expected there to be no messages report",
  );
});

Then("there should be a messages report", async function (this: ICustomWorld) {
  await assert.doesNotReject(
    () => fs.access(path.join(this.tmpDir, "cucumber-messages.ndjson")),
    "Expected there to be a messages file",
  );
});

Then(
  "there should be a messages similar to {string}",
  async function (this: ICustomWorld, fixturePath) {
    const ndjson = await readMessagesReport(this.tmpDir);

    const absoluteExpectedJsonpath = path.join(
      process.cwd(),
      "features",
      fixturePath,
    );

    if (process.env.WRITE_FIXTURES) {
      await fs.writeFile(absoluteExpectedJsonpath, ndJsonToString(ndjson));
    } else {
      const expectedJsonOutput = stringToNdJson(
        (await fs.readFile(absoluteExpectedJsonpath)).toString(),
      );

      assert.deepStrictEqual(ndjson, expectedJsonOutput);
    }
  },
);

Then(
  "the messages report should contain an image attachment for what appears to be a screenshot",
  async function (this: ICustomWorld) {
    const messages = await readMessagesReport(this.tmpDir);

    const attachments: messages.Attachment[] = messages
      .map((m) => m.attachment)
      .filter(notEmpty);

    if (attachments.length === 0) {
      throw new Error("Expected to find an attachment, but found none");
    } else if (attachments.length > 1) {
      throw new Error(
        "Expected to find a single attachment, but found " + attachments.length,
      );
    }

    const [attachment] = attachments;

    assert.strictEqual(attachment.mediaType, "image/png");

    const png = await new Promise<PNG>((resolve, reject) => {
      new PNG().parse(
        Buffer.from(toByteArray(attachment.body)),
        function (error, data) {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        },
      );
    });

    const expectedDimensions = {
      width: 1280,
      height: 720,
    };

    const { width: actualWidth, height: actualHeight } = png;

    assert.strictEqual(actualWidth, expectedDimensions.width);
    assert.strictEqual(actualHeight, expectedDimensions.height);
  },
);

Then(
  "the messages report shouldn't contain any specs",
  async function (this: ICustomWorld) {
    const messages = await readMessagesReport(this.tmpDir);

    for (const message of messages) {
      if (message.gherkinDocument) {
        throw new Error(
          `Expected to find no specs, but found a gherkin document`,
        );
      }
    }
  },
);

Then(
  "the message report should contain a non-zero duration of the step",
  async function (this: ICustomWorld) {
    const messages = await readMessagesReport(this.tmpDir, {
      normalize: false,
    });

    type TestStepFinishedEnvelope = Pick<
      Required<messages.Envelope>,
      "testStepFinished"
    >;

    const isTestStepFinishedEnvelope = (
      envelope: messages.Envelope,
    ): envelope is TestStepFinishedEnvelope => !!envelope.testStepFinished;

    const testStepFinishedCol: TestStepFinishedEnvelope[] = messages.filter(
      isTestStepFinishedEnvelope,
    );

    if (testStepFinishedCol.length !== 1) {
      throw new Error(
        "Expected to find a single testStepFinished envelope, but found " +
          testStepFinishedCol.length,
      );
    }

    const [{ testStepFinished }] = testStepFinishedCol;

    if (
      testStepFinished.testStepResult.duration.seconds === 0 &&
      testStepFinished.testStepResult.duration.nanos === 0
    ) {
      throw new Error("Expected to find non-zero duration");
    }
  },
);

Then(
  "the message report should contain a hook named {string}",
  async function (this: ICustomWorld, name) {
    const messages = await readMessagesReport(this.tmpDir);

    const hook = assertAndReturn(
      messages.map((message) => message.hook).find((hook) => hook),
      "Expected to find a hook among messages",
    );

    assert.equal(hook.name, name);
  },
);
