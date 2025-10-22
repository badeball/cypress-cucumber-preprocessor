import assert from "node:assert";
import { Given } from "@cucumber/cucumber";
import path from "node:path";
import { writeFile } from "../support/helpers";
import ICustomWorld from "../support/ICustomWorld";

Given(
  "two {string} hooks, last with order: {string}, asserting {string} execution",
  async function (this: ICustomWorld, hookType, orderOption, expectedOrder) {
    const availableHooks = [
      "Before",
      "After",
      "BeforeAll",
      "AfterAll",
      "BeforeStep",
      "AfterStep",
    ];

    if (availableHooks.indexOf(hookType) === -1) {
      assert.fail("Unrecognized hook: " + hookType);
    }

    if (orderOption !== "undefined" && !/^\d+$/.test(orderOption)) {
      assert.fail("Unrecognized option: " + orderOption);
    }

    const orders = ["in-order", "reversed"];

    if (orders.indexOf(expectedOrder) === -1) {
      assert.fail("Unrecognized order: " + expectedOrder);
    }

    const absoluteFilePath = path.join(
      this.tmpDir,
      "cypress/support/step_definitions/hooks.js",
    );

    let content: string = "";

    if (hookType.includes("Before")) {
      if (expectedOrder === "in-order") {
        content = `
          const { ${hookType} } = require("@badeball/cypress-cucumber-preprocessor");
          ${hookType}(function () {
            this.actualOrder = "in-order";
          });
          ${hookType}({ order: ${orderOption} }, function () {
            expect(this.actualOrder).to.equal("in-order");
          });
        `;
      } else {
        content = `
          const { ${hookType} } = require("@badeball/cypress-cucumber-preprocessor");
          ${hookType}(function () {
            expect(this.actualOrder).to.equal("reversed");
          });
          ${hookType}({ order: ${orderOption} }, function () {
            this.actualOrder = "reversed";
          });
        `;
      }
    } else {
      if (expectedOrder === "in-order") {
        content = `
          const { ${hookType} } = require("@badeball/cypress-cucumber-preprocessor");
          ${hookType}({ order: ${orderOption} }, function () {
            expect(this.actualOrder).to.equal("in-order");
          });
          ${hookType}(function () {
            this.actualOrder = "in-order";
          });
        `;
      } else {
        content = `
          const { ${hookType} } = require("@badeball/cypress-cucumber-preprocessor");
          ${hookType}(function () {
            this.actualOrder = "reversed";
          });
          ${hookType}({ order: ${orderOption} }, function () {
            expect(this.actualOrder).to.equal("reversed");
          });
        `;
      }
    }

    await writeFile(absoluteFilePath, content);
  },
);
