import path from "path";
import { promises as fs } from "fs";
import child_process from "child_process";
import { assertAndReturn } from "../lib/helpers/assertions";

function aggregatedTitle(test: Mocha.Suite | Mocha.Test): string {
  if (test.parent?.title) {
    return `${aggregatedTitle(test.parent)} - ${test.title}`;
  } else {
    return test.title;
  }
}

async function writeFile(filePath: string, fileContent: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, fileContent);
}

const projectPath = path.join(__dirname, "..");

describe("Run all specs", () => {
  beforeEach(async function () {
    const title = aggregatedTitle(
      assertAndReturn(
        this.test?.ctx?.currentTest,
        "Expected hook to have a context and a test",
      ),
    );

    this.tmpDir = path.join(projectPath, "tmp", title.replace(/[()?]/g, ""));

    await fs.rm(this.tmpDir, { recursive: true, force: true });

    await writeFile(
      path.join(this.tmpDir, "cypress.config.js"),
      `
        const { defineConfig } = require("cypress");
        const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
        const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
        const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        async function setupNodeEvents(on, config) {
          // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
          await preprocessor.addCucumberPreprocessorPlugin(on, config);

          on(
            "file:preprocessor",
            createBundler({
              plugins: [createEsbuildPlugin.default(config)],
            })
          );

          // Make sure to return the config object as it might have been modified by the plugin.
          return config;
        }

        module.exports = defineConfig({
          e2e: {
            experimentalRunAllSpecs: true,
            supportFile: false,
            specPattern: "**/*.feature",
            setupNodeEvents
          },
        });
      `,
    );

    await fs.mkdir(path.join(this.tmpDir, "node_modules", "@badeball"), {
      recursive: true,
    });

    await fs.symlink(
      projectPath,
      path.join(
        this.tmpDir,
        "node_modules",
        "@badeball",
        "cypress-cucumber-preprocessor",
      ),
    );
  });

  it("should work fine with seemingly (?) ambiguous step definitions", async function () {
    const feature = `
      Feature:
        Scenario:
          Given a step
    `;

    const steps = `
      const { Given } = require("@badeball/cypress-cucumber-preprocessor");
      Given("a step", function() {});
    `;

    await writeFile(
      path.join(this.tmpDir, "cypress", "integration", "a.feature"),
      feature,
    );

    await writeFile(
      path.join(this.tmpDir, "cypress", "integration", "a.ts"),
      steps,
    );

    await writeFile(
      path.join(this.tmpDir, "cypress", "integration", "b.feature"),
      feature,
    );

    await writeFile(
      path.join(this.tmpDir, "cypress", "integration", "b.ts"),
      steps,
    );

    child_process.spawnSync(
      path.join(projectPath, "node_modules", ".bin", "cypress"),
      ["open"],
      { cwd: this.tmpDir, stdio: "inherit" },
    );
  });
});
