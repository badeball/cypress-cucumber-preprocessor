import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";

import { Then } from "@cucumber/cucumber";
import {
  findAllByLabelText,
  findAllByText,
  findByText,
} from "@testing-library/dom";
import { JSDOM } from "jsdom";

import { findAllByAccordionComponent } from "../support/accordion";
import ICustomWorld from "../support/ICustomWorld";

Then("there should be a HTML report", async function (this: ICustomWorld) {
  await assert.doesNotReject(
    () => fs.access(path.join(this.tmpDir, "cucumber-report.html")),
    "Expected there to be a HTML file",
  );
});

Then(
  "the report should display when last run",
  async function (this: ICustomWorld) {
    const dom = await JSDOM.fromFile(
      path.join(this.tmpDir, "cucumber-report.html"),
      { runScripts: "dangerously" },
    );

    const time = await findByText(
      dom.window.document.documentElement,
      /\d+ seconds? ago/,
      { selector: "time" },
    );

    assert(time);
  },
);

Then(
  "the HTML should display {int} executed scenario(s)",
  async function (this: ICustomWorld, n: number) {
    const dom = await JSDOM.fromFile(
      path.join(this.tmpDir, "cucumber-report.html"),
      { runScripts: "dangerously" },
    );

    // configure({ defaultIgnore: "comments, script, style, link, g, path" });

    const AccordionItemButtons = await findAllByAccordionComponent(
      dom.window.document.documentElement,
      "AccordionItemButton",
    );

    for (const AccordionItemButton of AccordionItemButtons) {
      if (
        AccordionItemButton.attributes.getNamedItem("aria-expanded")?.value ===
        "false"
      ) {
        AccordionItemButton.click();
      }
    }

    const spans = await findAllByText(
      dom.window.document.documentElement,
      /Scenario/,
    );

    assert.equal(spans.length, n);
  },
);

Then(
  "the HTML should display {int}% passed scenarios",
  async function (this: ICustomWorld, n: number) {
    const dom = await JSDOM.fromFile(
      path.join(this.tmpDir, "cucumber-report.html"),
      { runScripts: "dangerously" },
    );

    const dd = await findByText(
      dom.window.document.documentElement,
      /\d+% passed/,
      { selector: "span" },
    );

    const actual = parseInt(dd.textContent!, 10);

    assert.equal(actual, n);
  },
);

Then(
  "the report should have an image attachment",
  async function (this: ICustomWorld) {
    const dom = await JSDOM.fromFile(
      path.join(this.tmpDir, "cucumber-report.html"),
      { runScripts: "dangerously" },
    );

    const AccordionItemPanel = await findByText(
      dom.window.document.documentElement,
      (_, element) => element?.textContent?.includes("Attached Image") ?? false,
      { selector: '[data-accordion-component="AccordionItemPanel"]' },
    );

    assert(AccordionItemPanel);
  },
);

/**
 * This is rather fudgy, due to number of X steps no longer being displayed in the reports after
 * a major refactor of @cucumber/react-components.
 *
 * @see https://github.com/cucumber/react-components/compare/v22.4.2...v23.0.0
 */
Then(
  "the HTML report should display {int} {string} step(s)",
  async function (this: ICustomWorld, n: number, status: string) {
    const dom = await JSDOM.fromFile(
      path.join(this.tmpDir, "cucumber-report.html"),
      { runScripts: "dangerously" },
    );

    // configure({ defaultIgnore: "comments, script, style, link, g, path" });

    const AccordionItemButtons = await findAllByAccordionComponent(
      dom.window.document.documentElement,
      "AccordionItemButton",
    );

    for (const AccordionItemButton of AccordionItemButtons) {
      if (
        AccordionItemButton.attributes.getNamedItem("aria-expanded")?.value ===
        "false"
      ) {
        AccordionItemButton.click();
      }
    }

    const stepsContainers = await findAllByLabelText(
      dom.window.document.documentElement,
      "Steps",
    );

    const matchingSteps = stepsContainers.reduce(
      (matchingSteps: Element[], stepsContainer: HTMLElement) => {
        return [
          ...matchingSteps,
          ...Array.from(
            stepsContainer.querySelectorAll(
              `[data-status="${status.toUpperCase()}"]`,
            ),
          ),
        ];
      },
      [],
    );

    assert.equal(matchingSteps.length, n);
  },
);
