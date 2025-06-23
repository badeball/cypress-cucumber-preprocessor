/**
 * This file is a near-copy of its sibling, entrypoint-node.test-d.ts. Neither should be edited
 * without a corresponding change in the other, IE. their type declarations should remain identical.
 */

import { expectType } from "tsd";

import messages from "@cucumber/messages";

import {
  resolvePreprocessorConfiguration,
  IPreprocessorConfiguration,
  addCucumberPreprocessorPlugin,
  beforeRunHandler,
  afterRunHandler,
  beforeSpecHandler,
  afterSpecHandler,
  afterScreenshotHandler,
  Given,
  When,
  Then,
  Step,
  defineParameterType,
  Before,
  After,
  BeforeStep,
  AfterStep,
  BeforeAll,
  AfterAll,
  DataTable,
} from "../lib/entrypoint-browser";

declare const config: Cypress.PluginConfigOptions;
declare const on: Cypress.PluginEvents;
declare const spec: Cypress.Spec;
declare const results: CypressCommandLine.RunResult;
declare const details: Cypress.ScreenshotDetails;

expectType<Promise<IPreprocessorConfiguration>>(
  resolvePreprocessorConfiguration(config, {}, "/"),
);

expectType<Promise<Cypress.PluginConfigOptions>>(
  addCucumberPreprocessorPlugin(on, config),
);

expectType<Promise<Cypress.PluginConfigOptions>>(
  addCucumberPreprocessorPlugin(on, config, {}),
);

expectType<Promise<Cypress.PluginConfigOptions>>(
  addCucumberPreprocessorPlugin(on, config, {
    omitBeforeRunHandler: true,
    omitAfterRunHandler: true,
    omitBeforeSpecHandler: true,
    omitAfterSpecHandler: true,
    omitAfterScreenshotHandler: true,
  }),
);

expectType<Promise<void>>(beforeRunHandler(config));

expectType<Promise<void>>(afterRunHandler(config));

expectType<Promise<void>>(beforeSpecHandler(config, spec));

expectType<Promise<void>>(afterSpecHandler(config, spec, results));

expectType<Promise<Cypress.ScreenshotDetails>>(
  afterScreenshotHandler(config, details),
);

Given("foo", function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

Given(/foo/, function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

When("foo", function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

When(/foo/, function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

Then("foo", function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

Then(/foo/, function (foo, bar: number, baz: string) {
  expectType<Mocha.Context>(this);
  expectType<unknown>(foo);
  expectType<number>(bar);
  expectType<string>(baz);
});

declare const table: DataTable;

Then("foo", function () {
  // Step should consume Mocha.Context.
  Step(this, "foo");
});

Then("foo", function () {
  // Step should consume DataTable's.
  Step(this, "foo", table);
});

Then("foo", function () {
  // Step should consume doc strings.
  Step(this, "foo", "bar");
});

defineParameterType({
  name: "foo",
  regexp: /foo/,
  transformer(foo, bar, baz) {
    expectType<Mocha.Context>(this);
    expectType<string>(foo);
    expectType<string>(bar);
    expectType<string>(baz);
  },
});

defineParameterType({
  name: "foo",
  regexp: /foo/,
});

BeforeAll(function () {
  expectType<Mocha.Context>(this);
});

AfterAll(function () {
  expectType<Mocha.Context>(this);
});

Before(function () {
  expectType<Mocha.Context>(this);
});

Before({}, function () {
  expectType<Mocha.Context>(this);
});

Before({ tags: "foo", name: "bar", order: 1 }, function () {
  expectType<Mocha.Context>(this);
});

After(function () {
  expectType<Mocha.Context>(this);
});

After({}, function () {
  expectType<Mocha.Context>(this);
});

After({ tags: "foo", name: "bar", order: 1 }, function () {
  expectType<Mocha.Context>(this);
});

BeforeStep(function ({
  pickle,
  pickleStep,
  gherkinDocument,
  testCaseStartedId,
  testStepId,
}) {
  expectType<Mocha.Context>(this);
  expectType<messages.Pickle>(pickle);
  expectType<messages.PickleStep>(pickleStep);
  expectType<messages.GherkinDocument>(gherkinDocument);
  expectType<string>(testCaseStartedId);
  expectType<string>(testStepId);
});

BeforeStep(
  {},
  function ({
    pickle,
    pickleStep,
    gherkinDocument,
    testCaseStartedId,
    testStepId,
  }) {
    expectType<Mocha.Context>(this);
    expectType<messages.Pickle>(pickle);
    expectType<messages.PickleStep>(pickleStep);
    expectType<messages.GherkinDocument>(gherkinDocument);
    expectType<string>(testCaseStartedId);
    expectType<string>(testStepId);
  },
);

BeforeStep(
  { tags: "foo", name: "bar", order: 1 },
  function ({
    pickle,
    pickleStep,
    gherkinDocument,
    testCaseStartedId,
    testStepId,
  }) {
    expectType<Mocha.Context>(this);
    expectType<messages.Pickle>(pickle);
    expectType<messages.PickleStep>(pickleStep);
    expectType<messages.GherkinDocument>(gherkinDocument);
    expectType<string>(testCaseStartedId);
    expectType<string>(testStepId);
  },
);

AfterStep(function ({
  pickle,
  pickleStep,
  gherkinDocument,
  testCaseStartedId,
  testStepId,
}) {
  expectType<Mocha.Context>(this);
  expectType<messages.Pickle>(pickle);
  expectType<messages.PickleStep>(pickleStep);
  expectType<messages.GherkinDocument>(gherkinDocument);
  expectType<string>(testCaseStartedId);
  expectType<string>(testStepId);
});

AfterStep(
  {},
  function ({
    pickle,
    pickleStep,
    gherkinDocument,
    testCaseStartedId,
    testStepId,
  }) {
    expectType<Mocha.Context>(this);
    expectType<messages.Pickle>(pickle);
    expectType<messages.PickleStep>(pickleStep);
    expectType<messages.GherkinDocument>(gherkinDocument);
    expectType<string>(testCaseStartedId);
    expectType<string>(testStepId);
  },
);

AfterStep(
  { tags: "foo", name: "bar", order: 1 },
  function ({
    pickle,
    pickleStep,
    gherkinDocument,
    testCaseStartedId,
    testStepId,
  }) {
    expectType<Mocha.Context>(this);
    expectType<messages.Pickle>(pickle);
    expectType<messages.PickleStep>(pickleStep);
    expectType<messages.GherkinDocument>(gherkinDocument);
    expectType<string>(testCaseStartedId);
    expectType<string>(testStepId);
  },
);

expectType<messages.GherkinDocument>(window.testState.gherkinDocument);
expectType<messages.Pickle[]>(window.testState.pickles);
expectType<messages.Pickle>(window.testState.pickle);
expectType<messages.PickleStep | undefined>(window.testState.pickleStep);

/**
 * Extending world (example #1)
 */
interface MathWorld {
  add(a: number, b: number): number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Mocha {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Context extends MathWorld {}
  }
}

Given(/foo/, function () {
  expectType<number>(this.add(1, 2));
});

When(/foo/, function () {
  expectType<number>(this.add(1, 2));
});

Then(/foo/, function () {
  expectType<number>(this.add(1, 2));
});

/**
 * Extending world (example #2)
 */

interface CustomWorld extends Mocha.Context {
  pageDriver: {
    navigateTo(url: string): void;
  };
}

Given(/foo/, function (this: CustomWorld, url: string) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo(url);
});

When(/foo/, function (this: CustomWorld, url: string) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo(url);
});

Then(/foo/, function (this: CustomWorld, url: string) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo(url);
});

Before(function (this: CustomWorld) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo("foo");
});

After(function (this: CustomWorld) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo("foo");
});

BeforeStep(function (this: CustomWorld) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo("foo");
});

AfterStep(function (this: CustomWorld) {
  expectType<CustomWorld>(this);
  this.pageDriver.navigateTo("foo");
});
