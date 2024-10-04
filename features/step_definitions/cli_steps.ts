import fs from "fs/promises";
import util from "util";
import path from "path";
import { When, Then } from "@cucumber/cucumber";
import assert from "assert";
import childProcess from "child_process";
import stripAnsi from "strip-ansi";
import * as glob from "glob";
import ICustomWorld from "../support/ICustomWorld";
import { expectLastRun, rescape } from "../support/helpers";

const isCI = process.env.CI === "true";

function execAsync(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function parseArgs(unparsedArgs: string): Promise<string[]> {
  // Use user's preferred shell to split args.
  const { stdout } = await execAsync(
    `node -p "JSON.stringify(process.argv)" -- ${unparsedArgs}`,
  );

  // Drop 1st arg, which is the path of node.
  const [, ...extraArgs] = JSON.parse(stdout);

  return extraArgs;
}

When(
  "I run cypress",
  { timeout: 60 * 1000 },
  async function (this: ICustomWorld) {
    await this.runCypress();
  },
);

When(
  "I run cypress with {string}",
  { timeout: 60 * 1000 },
  async function (this: ICustomWorld, unparsedArgs) {
    await this.runCypress({ extraArgs: await parseArgs(unparsedArgs) });
  },
);

When(
  "I run cypress with {string} \\(expecting exit code {int})",
  { timeout: 60 * 1000 },
  async function (
    this: ICustomWorld,
    unparsedArgs: string,
    expectedExitCode: number,
  ) {
    await this.runCypress({
      extraArgs: await parseArgs(unparsedArgs),
      expectedExitCode,
    });
  },
);

When(
  "I run cypress with environment variables",
  { timeout: 60 * 1000 },
  async function (this: ICustomWorld, table) {
    await this.runCypress({ extraEnv: Object.fromEntries(table.rows()) });
  },
);

When(
  "I run cypress with a chromium-family browser",
  { timeout: 60 * 1000 },
  async function (this: ICustomWorld) {
    /**
     * Chrome is installed in CI, Chromium is installed in my (maintainer) environment.
     */
    await this.runCypress({
      extraArgs: ["--browser", isCI ? "chrome" : "chromium"],
    });
  },
);

When(
  "I merge the messages reports",
  { timeout: 60 * 1000 },
  async function (this: ICustomWorld) {
    const extraArgs = (
      await glob.glob("*.ndjson", { cwd: this.tmpDir })
    ).sort();

    await this.runMergeMessages({
      extraArgs,
      expectedExitCode: 0,
    });

    const absoluteFilePath = path.join(this.tmpDir, "cucumber-messages.ndjson");

    await fs.writeFile(absoluteFilePath, expectLastRun(this).output);
  },
);

Then("it passes", function (this: ICustomWorld) {
  assert.equal(expectLastRun(this).exitCode, 0, "Expected a zero exit code");
});

Then("it fails", function (this: ICustomWorld) {
  assert.notEqual(
    expectLastRun(this).exitCode,
    0,
    "Expected a non-zero exit code",
  );
  this.verifiedLastRunError = true;
});

Then(
  "it should appear as if only a single test ran",
  function (this: ICustomWorld) {
    assert.match(
      expectLastRun(this).stdout,
      /All specs passed!\s+\d+ms\s+1\s+1\D/,
    );
  },
);

Then("it should appear as if both tests ran", function (this: ICustomWorld) {
  assert.match(
    expectLastRun(this).stdout,
    /All specs passed!\s+\d+ms\s+2\s+2\D/,
  );
});

Then(
  "it should appear as if both tests were skipped",
  function (this: ICustomWorld) {
    assert.match(
      expectLastRun(this).stdout,
      /All specs passed!\s+\d+ms\s+2\s+-\s+-\s+2\D/,
    );
  },
);

const ranTestExpr = (spec: string) =>
  new RegExp("Running:\\s+" + rescape(spec));

Then(
  "it should appear to have ran spec {string}",
  function (this: ICustomWorld, spec) {
    assert.match(expectLastRun(this).stdout, ranTestExpr(spec));
  },
);

Then(
  "it should appear to not have ran spec {string}",
  function (this: ICustomWorld, spec) {
    assert.doesNotMatch(expectLastRun(this).stdout, ranTestExpr(spec));
  },
);

Then(
  "it should appear to have ran spec {string} and {string}",
  function (this: ICustomWorld, a, b) {
    for (const spec of [a, b]) {
      assert.match(expectLastRun(this).stdout, ranTestExpr(spec));
    }
  },
);

Then(
  "I should not see {string} in the output",
  function (this: ICustomWorld, string) {
    if (expectLastRun(this).stdout.includes(string)) {
      assert.fail(`Expected to not find ${util.inspect(string)}, but did`);
    }
  },
);

const runScenarioExpr = (scenarioName: string) =>
  new RegExp(`(?:✓|√) ${rescape(scenarioName)}( \\(\\d+ms\\))?\\n`);

const pendingScenarioExpr = (scenarioName: string) =>
  new RegExp(`- ${rescape(scenarioName)}\n`);

Then(
  "it should appear to have run the scenario {string}",
  function (this: ICustomWorld, scenarioName) {
    assert.match(expectLastRun(this).stdout, runScenarioExpr(scenarioName));
  },
);

Then(
  "it should appear to not have run the scenario {string}",
  function (this: ICustomWorld, scenarioName) {
    assert.doesNotMatch(
      expectLastRun(this).stdout,
      runScenarioExpr(scenarioName),
    );
  },
);

Then(
  "it should appear to have run the scenarios",
  function (this: ICustomWorld, scenarioTable) {
    for (const { Name: scenarioName } of scenarioTable.hashes()) {
      assert.match(expectLastRun(this).stdout, runScenarioExpr(scenarioName));
    }
  },
);

Then(
  "it should appear to not have run the scenarios",
  function (this: ICustomWorld, scenarioTable) {
    for (const { Name: scenarioName } of scenarioTable.hashes()) {
      assert.doesNotMatch(
        expectLastRun(this).stdout,
        runScenarioExpr(scenarioName),
      );
    }
  },
);

const normalizeOutput = (world: ICustomWorld) =>
  stripAnsi(expectLastRun(world).stdout)
    .replaceAll("\\", "/")
    .replaceAll("×", "✖");

Then("the output should contain", function (this: ICustomWorld, content) {
  assert.match(normalizeOutput(this), new RegExp(rescape(content)));
});

Then(
  "the output should not contain {string}",
  function (this: ICustomWorld, content) {
    assert.doesNotMatch(normalizeOutput(this), new RegExp(rescape(content)));
  },
);

Then(
  "it should appear to have skipped the scenario {string}",
  function (this: ICustomWorld, scenarioName) {
    assert.match(expectLastRun(this).stdout, pendingScenarioExpr(scenarioName));
  },
);

Then(
  "I should see exactly {int} instance(s) of {string} in stderr",
  function (this: ICustomWorld, expectedOccurences: number, output: string) {
    const actualyOccurences =
      expectLastRun(this).stderr.match(new RegExp(rescape(output), "g"))
        ?.length ?? 0;

    assert.equal(actualyOccurences, expectedOccurences);
  },
);
