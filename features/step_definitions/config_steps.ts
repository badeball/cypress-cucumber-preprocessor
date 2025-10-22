import { Given } from "@cucumber/cucumber";
import path from "path";
import fs from "fs/promises";
import { insertValuesInConfigFile } from "../support/configFileUpdater";
import ICustomWorld from "../support/ICustomWorld";

async function updateJsonConfiguration(
  absoluteConfigPath: string,
  additionalJsonContent: any,
) {
  const existingConfig = JSON.parse(
    (await fs.readFile(absoluteConfigPath)).toString(),
  );

  await fs.writeFile(
    absoluteConfigPath,
    JSON.stringify(
      {
        ...existingConfig,
        ...additionalJsonContent,
      },
      null,
      2,
    ),
  );
}

Given(
  "additional preprocessor configuration",
  async function (this: ICustomWorld, jsonContent) {
    const absoluteConfigPath = path.join(
      this.tmpDir,
      ".cypress-cucumber-preprocessorrc",
    );

    await updateJsonConfiguration(absoluteConfigPath, JSON.parse(jsonContent));
  },
);

Given(
  "additional Cypress configuration",
  async function (this: ICustomWorld, jsonContent) {
    await insertValuesInConfigFile(
      path.join(this.tmpDir, "cypress.config.js"),
      JSON.parse(jsonContent),
    );
  },
);
