# cypress-cucumber-preprocessor

[![Build status](https://github.com/badeball/cypress-cucumber-preprocessor/actions/workflows/build.yml/badge.svg)](https://github.com/badeball/cypress-cucumber-preprocessor/actions/workflows/build.yml)
[![Npm package weekly downloads](https://badgen.net/npm/dw/@badeball/cypress-cucumber-preprocessor)](https://npmjs.com/package/@badeball/cypress-cucumber-preprocessor)

<div align="center">

[Quick start](docs/quick-start.md) •
[Documentation](docs/readme.md) •
[Contributing](CONTRIBUTING.md)

</div>

This preprocessor aims to provide a developer experience and behavior similar to that of [Cucumber](https://cucumber.io/), to Cypress.

> :information_source: The repository has recently moved from `github.com/TheBrainFamily` to `github.com/badeball`. Read more about the transfer of ownership [here](https://github.com/badeball/cypress-cucumber-preprocessor/issues/689).

## Installation

```
$ npm install @badeball/cypress-cucumber-preprocessor
```

## Introduction

The preprocessor (with its dependencies) parses Gherkin documents and allows you to write tests as shown below.

```cucumber
# cypress/e2e/duckduckgo.feature
Feature: duckduckgo.com
  Scenario: visiting the frontpage
    When I visit duckduckgo.com
    Then I should see a search bar
```

```ts
// cypress/e2e/duckduckgo.ts
import { When, Then } from "@badeball/cypress-cucumber-preprocessor";

When("I visit duckduckgo.com", () => {
  cy.visit("https://www.duckduckgo.com");
});

Then("I should see a search bar", () => {
  cy.get("input[type=text]")
    .should("have.attr", "placeholder")
    .and(
      "match",
      /Search without being tracked|Search privately/,
    );
});
```

## Building

Building can be done once using:

```
$ npm run build
```

Or upon file changes with:

```
$ npm run watch
```

There are multiple types of tests, all ran using npm scripts:

```
$ npm run test:fmt
$ npm run test:types
$ npm run test:unit
$ npm run test:integration # make sure to build first
$ npm run test # runs all of the above
```

## Attribution

A special thanks goes out to [Łukasz Gandecki](https://github.com/lgandecki) for developing and maintaining the cypress-cucumber integration before me, in addition to [all other contributors](https://github.com/badeball/cypress-cucumber-preprocessor/graphs/contributors). Some of the work has partially been sponsored by [Klaveness Digital](https://www.klavenessdigital.com/).
