[← Back to documentation](readme.md)

# Installation

```
$ npm install @badeball/cypress-cucumber-preprocessor
```

# Example setup

[Configure](https://docs.cypress.io/guides/references/configuration) `specPattern` with `"**/*.feature"` and `setupNodeEvents` with a bundler, using EG. `cypress.config.ts`.

```ts
import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

export default defineConfig({
  e2e: {
    specPattern: "**/*.feature",
    async setupNodeEvents(
      on: Cypress.PluginEvents,
      config: Cypress.PluginConfigOptions
    ): Promise<Cypress.PluginConfigOptions> {
      // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
      await addCucumberPreprocessorPlugin(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      // Make sure to return the config object as it might have been modified by the plugin.
      return config;
    },
  },
});
```

The example above illustrates how to use the preprocessor together with Esbuild, which is the recommended bundler if you have no particular requirements (it's by far the fastest). See [examples/](../examples) for how-to using Browserify, Esbuild or Webpack, in all language flavors (CJS, ESM, TS).

Read more about the preprocessor's configuration options at [docs/configuration.md](configuration.md).

# Note for TypeScript users

The package utilizes [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) and you may have to set `moduleResolution` to `node16` in your `tsconfig.json` depending on what parts of the package you use, like shown below.

```json
{
  "compilerOptions": {
    "moduleResolution": "node16"
  }
}
```

TypeScript users that are unable to upgrade `moduleResolution` to `node16`, can use the `paths` property as a workaround, like shown below.

```json
{
  "compilerOptions": {
    "paths": {
      "@badeball/cypress-cucumber-preprocessor/*": ["./node_modules/@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/*"]
    }
  }
}
```

# Usage with other plugins

If you're using the preprocessor _with other plugins_, please read [docs/event-handlers.md: On event handlers](event-handlers.md) **carefully**.

# Write a test

Write Gherkin documents and add a file for type definitions with a corresponding name (read more about how step definitions are resolved in [docs/step-definitions.md](step-definitions.md)). Reading [docs/cucumber-basics.md](cucumber-basics.md) is highly recommended.

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
      /Search the web without being tracked|Search without being tracked/,
    );
});
```
