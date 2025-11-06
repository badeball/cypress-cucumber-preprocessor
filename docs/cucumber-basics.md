[← Back to documentation](readme.md)

# Table of Contents <!-- omit from toc -->

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

- [Step definitions](#step-definitions)
  - [Expressions](#expressions)
  - [Arguments](#arguments)
  - [Custom parameter types](#custom-parameter-types)
  - [Pending steps](#pending-steps)
  - [Skipped steps](#skipped-steps)
  - [Nested steps](#nested-steps)
- [Hooks](#hooks)
  - [Run hooks](#run-hooks)
  - [Scenario hooks](#scenario-hooks)
    - [Pending / skipped scenario hooks](#pending--skipped-scenario-hooks)
  - [Step hooks](#step-hooks)
  - [Hook ordering](#hook-ordering)
  - [Named hooks](#named-hooks)

# Step definitions

## Expressions

A step definition’s *expression* can either be a regular expression or a [cucumber expression](https://github.com/cucumber/cucumber-expressions#readme). The examples in this section use cucumber expressions. If you prefer to use regular expressions, each *capture group* from the match will be passed as arguments to the step definition’s function.

```ts
Given("I have {int} cukes in my belly", (cukes: number) => {});
```

## Arguments

Steps can be accompanied by [doc strings](https://cucumber.io/docs/gherkin/reference/#doc-strings) or [data tables](https://cucumber.io/docs/gherkin/reference/#data-tables), both which will be passed to the step definition as the last argument, as shown below.

```gherkin
Feature: a feature
  Scenario: a scenario
    Given a table step
      | Cucumber     | Cucumis sativus |
      | Burr Gherkin | Cucumis anguria |
```

```ts
import { Given, DataTable } from "@badeball/cypress-cucumber-preprocessor";

Given(/^a table step$/, (table: DataTable) => {
  const expected = [
    ["Cucumber", "Cucumis sativus"],
    ["Burr Gherkin", "Cucumis anguria"]
  ];
  assert.deepEqual(table.raw(), expected);
});
```

See [here](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/data_table_interface.md) for `DataTable`'s interface.

## Custom parameter types

Custom parameter types can be registered using `defineParameterType()`. They share the same scope as tests and you can invoke `defineParameterType()` anywhere you define steps, though the order of definition is unimportant. The table below explains the various arguments you can pass when defining a parameter type.

| Argument      | Description |
| ------------- | ----------- |
| `name`        | The name the parameter type will be recognised by in output parameters.
| `regexp`      | A regexp that will match the parameter. May include capture groups.
| `transformer` | A function or method that transforms the match from the regexp. Must have arity 1 if the regexp doesn't have any capture groups. Otherwise the arity must match the number of capture groups in `regexp`. |

## Pending steps

You can return `"pending"` from a step definition or a chain to mark a step as pending. This will halt the execution and Cypress will report the test as "skipped". This is generally used for marking steps as "unimplemented" and allows you to commit unfinished work without breaking the test suite.

```ts
import { When } from "@badeball/cypress-cucumber-preprocessor";

When("a step", () => {
  return "pending";
});
```

```ts
import { When } from "@badeball/cypress-cucumber-preprocessor";

When("a step", () => {
  cy.then(() => {
    return "pending";
  });
});
```

## Skipped steps

You can return `"skipped"` from a step definition or a chain to mark a step as pending. This will halt the execution and Cypress will report the test as "skipped". This however is generally used for conditionally short circuiting a test.

```ts
import { When } from "@badeball/cypress-cucumber-preprocessor";

When("a step", () => {
  return "skipped";
});
```

```ts
import { When } from "@badeball/cypress-cucumber-preprocessor";

When("a step", () => {
  cy.then(() => {
    return "skipped";
  });
});
```

## Nested steps

You can invoke other steps from a step using `Step()`, as shown below.

```ts
import { When, Step } from "@badeball/cypress-cucumber-preprocessor";

When("I fill in the entire form", function () {
  Step(this, 'I fill in "john.doe" for "Username"');
  Step(this, 'I fill in "password" for "Password"');
});
```

`Step()` optionally accepts a `DataTable` or `string` argument.

```ts
import {
  When,
  Step,
  DataTable
} from "@badeball/cypress-cucumber-preprocessor";

When("I fill in the entire form", function () {
  Step(
    this,
    "I fill in the value",
    new DataTable([
      ["Field", "Value"],
      ["Username", "john.doe"],
      ["Password", "password"]
    ])
  );
});
```

# Hooks

There are three types of hooks, run hooks, scenario hooks and step hooks, each explained below.

## Run hooks

`BeforeAll()` and `AfterAll()` are identical to Cypress' `before()` and `after()`.

```ts
import { BeforeAll } from "@badeball/cypress-cucumber-preprocessor";

BeforeAll(function () {
  // This hook will be executed once at the beginnig of a feature.
});
```

## Scenario hooks

`Before()` and `After()` is similar to Cypress' `beforeEach()` and `afterEach()`, but they can be selected to conditionally run based on the tags of each scenario, as shown below. Furthermore, failure in these hooks does **not** result in remaining tests being skipped. This is contrary to Cypress' `beforeEach` and `afterEach`.

> **Note**  
> Contrary to how cucumber-js works, these `After()` hooks **does not** run if your scenario fails[^1].

```ts
import { Before } from "@badeball/cypress-cucumber-preprocessor";

Before(function () {
  // This hook will be executed before all scenarios.
});

Before({ tags: "@foo" }, function () {
  // This hook will be executed before scenarios tagged with @foo.
});

Before({ tags: "@foo and @bar" }, function () {
  // This hook will be executed before scenarios tagged with @foo and @bar.
});

Before({ tags: "@foo or @bar" }, function () {
  // This hook will be executed before scenarios tagged with @foo or @bar.
});

Before(function ({ pickle, gherkinDocument, testCaseStartedId }) {
  // Scenario hooks are invoked with an object containing a bunch of relevant data.
});
```

### Pending / skipped scenario hooks

Scenario hooks can be made pending or skipped similarly to steps, as explained above, by returning `"pending"` or `"skipped"`, respectively. Both will halt the execution and Cypress will report the test as "skipped".

## Step hooks

`BeforeStep()` and `AfterStep()` are hooks invoked before and after each step, respectively. These too can be selected to conditionally run based on the tags of each scenario, as shown below.

> **Note**  
> Contrary to how cucumber-js works, these `AfterStep()` hooks **does not** run if your step fails[^1].

```ts
import { BeforeStep } from "@badeball/cypress-cucumber-preprocessor";

BeforeStep(function (options) {
  // This hook will be executed before all steps.
});

BeforeStep({ tags: "@foo" }, function () {
  // This hook will be executed before steps in scenarios tagged with @foo.
});

BeforeStep({ tags: "@foo and @bar" }, function () {
  // This hook will be executed before steps in scenarios tagged with @foo and @bar.
});

BeforeStep({ tags: "@foo or @bar" }, function () {
  // This hook will be executed before steps in scenarios tagged with @foo or @bar.
});

BeforeStep(function ({ pickle, pickleStep, gherkinDocument, testCaseStartedId, testStepId }) {
  // Step hooks are invoked with an object containing a bunch of relevant data.
});
```

[^1]: This discrepancy between the preprocessor and cucumber-js is currently considered to be unsolvable, as explained [here](https://github.com/badeball/cypress-cucumber-preprocessor/issues/824#issuecomment-1561492281).

## Hook ordering

You can specify an explicit order for hooks if you need to. The default order is 10000. Before-type hooks are executed in ascending order, while After-type hooks are executed in descending order.

```ts
import { Before, BeforeStep, After, AfterStep } from "@badeball/cypress-cucumber-preprocessor";

BeforeAll({ order: 10 }, function () {});
Before({ order: 10 }, function () {});
BeforeStep({ order: 10 }, function () {});
```

## Named hooks

Both scenario hooks and step hooks can optionally be named. Names are displayed in the command log, as well as in [messages reports](messages-report.md).

```ts
import { Before, BeforeStep, After, AfterStep } from "@badeball/cypress-cucumber-preprocessor";

Before({ name: "foo" }, function () {});
BeforeStep({ name: "bar" }, function () {});
After({ name: "baz" }, function () {});
AfterStep({ name: "qux" }, function () {});
```
