[← Back to documentation](readme.md)

# Source maps

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

How to enable source maps for each bundler is shown below.

## esbuild

Source maps can be enabled using an optional argument to `createEsbuildPlugin()`, like seen below.
The process of ensuring that source maps are not only enabled, but also "pretty", is somewhat
cumbersome in lieu of [evanw/esbuild#2218](https://github.com/evanw/esbuild/issues/2218). Hence,
this is disabled by default until it has been sufficiently tested.

```js
const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

async function setupNodeEvents(on, config) {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin(config, { prettySourceMap: true })]
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://duckduckgo.com",
    specPattern: "**/*.feature",
    setupNodeEvents,
  },
});
```

## Webpack

Source maps are enabled by default.

## Browserify

Source maps are enabled by default.
