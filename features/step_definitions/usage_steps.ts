import { Then } from "@cucumber/cucumber";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert";
import { expectLastRun, rescape } from "../support/helpers";
import ICustomWorld from "../support/ICustomWorld";

const normalizeUsageOutput = (content: string) =>
  content.replaceAll("\\", "/").replaceAll(/\d+\.\d+ms/g, (match: string) => {
    const replaceWith = "0.00ms";
    return replaceWith + " ".repeat(match.length - replaceWith.length);
  });

Then(
  "there should be a usage report named {string} containing",
  async function (file, expectedContent) {
    const absoluteFilePath = path.join(this.tmpDir, file);

    const actualContent = (await fs.readFile(absoluteFilePath)).toString();

    assert.equal(normalizeUsageOutput(actualContent), expectedContent + "\n");
  },
);

Then(
  "the output should contain a usage report",
  function (this: ICustomWorld, expectedContent) {
    assert.match(
      normalizeUsageOutput(expectLastRun(this).stdout),
      new RegExp(rescape(expectedContent)),
    );
  },
);
