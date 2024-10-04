# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Cache requested source maps, fixes [#1245](https://github.com/badeball/cypress-cucumber-preprocessor/discussions/1245).

## v21.0.1

- Support config file locations other than project root, fixes [#1243](https://github.com/badeball/cypress-cucumber-preprocessor/discussions/1243).

## v21.0.0

Breaking changes:

- Exported member `preprocessor` of `@badeball/cypress-cucumber-preprocessor/browserify` is removed.

  - User of `@badeball/cypress-cucumber-preprocessor/browserify` should change their Cypress config in accordance with the related [examples](examples).

- The executable `cypress-cucumber-diagnostics` has been replaced by a [`dryRun` option](docs/dry-run.md), relates to [#1120](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1120) and [#1129](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1129).

  - This is a massive overhaul of a feature that was originally ill-thought-out. I'm curious about the reception.

Other changees:

- Re-introduce support for Node v18, fixes [#1230](https://github.com/badeball/cypress-cucumber-preprocessor/discussions/1230).

- Generate a temporary messages report in case of `JsonFormatter` errors, relates to [#1161](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1161).

- Support project directories containing square brackets, EG. `/home/[foo] my project/`, relates to [#1196](https://github.com/badeball/cypress-cucumber-preprocessor/discussions/1196).

- Allow features in arbitrary locations, fixes [#1225](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1225).

## v20.1.2

- Updated all dependencies, including esbuild, relates to [#1068](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1068).

## v20.1.1

- Omit outputting empty "then" entries to the command log, relates to [#1214](https://github.com/badeball/cypress-cucumber-preprocessor/discussions/1214).

## v20.1.0

- Include skipped (not omitted) tests in reports, fixes [#1041](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1041).

## v20.0.7

- Updated all dependencies, fixes [#1198](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1198).

## v20.0.6

- Search for configuration files using strategy `project`, fixes [#1185](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1185). 

## v20.0.5

- Updated all dependencies, fixes [#1180](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1180).

## v20.0.4

- Fix type signature of `defineParameterType` to correctly reflect `transformer` property's optionality, fixes [#1179](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1179).

## v20.0.3

- Handle browser / page crash gracefully, fixes [#1172](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1172).

## v20.0.2

- Add support for skipped / pending scenario hooks, fixes [#1159](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1159).

- Add support for suite-level test configuration, fixes [#1158](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1158).

## v20.0.1

- Handle more corner cases related to reload-behavior, fixes [#1142](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1142).

## v20.0.0

Breaking changes:

- The `onAfterStep` hook, part of the [API](docs/json-report.md#attachments-node-environment) for adding attachments from the Node environment, is no longer invoked after scenario hooks, IE. `After(..)` and `Before(..)`.

  - It now more closely mimic the behavior of `AfterStep(..)`, which it was supposed to.

- The above-mentioned `onAfterStep` hook, is no longer invoked with a `wasLastStep` property.

  - This is now easily determined by using other properties, as reflected in the docs.

- Messages reports are no longer implicitly enabled and written to disk when enabling JSON or HTML reports, fixes [#1140](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1140).

Other changes:

- Emit meta information (lib version, node version, os, ci) in meesage reports, fixes [#1133](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1133).

  - This is in line with how cucumber-js behaves.

- The above-mentioned `onAfterStep` hook, is now invoked with a bunch of relevant data, relates to [#1089](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1089).

- Add a tool for [merging messages reports](docs/merging-reports.md), fixes [#1137](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1137).

  - This is first and foremost created to support merging related reports obtained through parallelization using Cypress Cloud.

## v19.2.0

- Add order option to all hooks, fixes [#481](https://github.com/badeball/cypress-cucumber-preprocessor/issues/481).

- Add a [`filterSpecsMixedMode`](docs/tags.md#tag-filters-and-non-cucumber-specs) option, fixes [#1125](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1125).

  - This essentially reverts 0b2702b from v19.1.1 and re-introduces original behavior of discarding non-feature specs by default and introduces an option to control this behavior.

## v19.1.1

- Mock and imitate Cypress globals during diagnostics / dry run, fixes [#1120](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1120).

- Avoid filtering non-feature specs upon tag expressions containing negating expressions, fixes [#1116](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1116).

  - Non-feature specs are filtered as if containing an empty set of tags.

## v19.1.0

- Add `BeforeAll(..)` and `AfterAll(..)` hooks, fixes [#758](https://github.com/badeball/cypress-cucumber-preprocessor/issues/758).

## v19.0.1

- Fix type members to account for scenario hook names, fixes [#1113](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1113).

## v19.0.0

Breaking changes:

- Run `After(..)` hooks in reversed order of definition. This is in line with how cucumber-js behaves.

- Updated all dependencies, including `@cucumber/cucumber` to v10.

  - String literal attachments are now base64-encoded in JSON reports, ref. [cucumber/cucumber-js#2261](https://github.com/cucumber/cucumber-js/pull/2261).

Other changes:

- Scenario hooks (`Before(..)` and `After(..)`) are now invoked with an object containing a bunch of relevant data. This is in line with how cucumber-js behaves.

- Hooks may now be optionally named. This is in line with how cucumber-js behaves.

- Omit outputting internal task to the command log when using `attach(..)`.

- Add an [API](docs/json-report.md#attachments-node-environment) for adding attachments from the Node environment, fixes [#1089](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1089).

## v18.0.6

- Make the compile output play nicer with ESM, relates to [#1093](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1093).

- Allow visiting unconfigured domains in `before` hooks, fixes [#1091](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1091).

## v18.0.5

- Add support for Cypress v13, fixes [#1084](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1084).

## v18.0.4

- Update dependency on esbuild, fixes [#1068](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1068).

## v18.0.3

- Allow (testing) type-specific configuration of `stepDefinitions`, fixes [#1065](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1065).

## v18.0.2

- Add support for skipped steps, fixes [#1053](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1053).

- Handle use of `this.skip()` correctly in reports, fixes [#1054](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1054).

- Export type member `IPreprocessorConfiguration`, fixes / supersedes [#1057](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1057).

- Fix asynchronous scheduling of nested step, fixes [#1063](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1063).

## v18.0.1

- Give each TestStep (from `@cucumber/messages`) a unique ID, fixes [#1034](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1034).

## v18.0.0

Breaking changes:

- TypeScript users that have previously been unable to upgrade `moduleResolution` to `node16`, and use the `paths` property as a workaround, must update their paths.

  From this

  ```
  {
    "compilerOptions": {
      "paths": {
        "@badeball/cypress-cucumber-preprocessor/*": ["./node_modules/@badeball/cypress-cucumber-preprocessor/dist/bundler-utils/*"]
      }
    }
  }
  ```

  To this

  ```
  {
    "compilerOptions": {
      "paths": {
        "@badeball/cypress-cucumber-preprocessor/*": ["./node_modules/@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/*"]
      }
    }
  }
  ```

Other changes:

- Add experimental support for [pretty output](docs/pretty-output.md) similar to that of [`@cucumber/pretty-formatter`](https://github.com/cucumber/cucumber-js-pretty-formatter), fixes [#810](https://github.com/badeball/cypress-cucumber-preprocessor/issues/810).

## v17.2.1

- Step hooks are logged using separate log groups, similar to how scenario hooks are logged.

- Properly escape error messages in interactive mode.

- Fix error in non-feature specs under certain conditions, fixes [#1028](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1028).

- Allow doesFeatureMatch to be called in support files, fixes [#1025](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1025).

## v17.2.0

- Add BeforeStep and AfterStep hooks, fixes [#847](https://github.com/badeball/cypress-cucumber-preprocessor/issues/847).

- Report failing steps with correct duration, fixes [#963](https://github.com/badeball/cypress-cucumber-preprocessor/issues/963).

## v17.1.1

- Allow generation of JSON reports with hooks (After / Before) even if `baseUrl` is undefined, fixes [#1017](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1017).

- Correctly filter test cases in HTML reports when using `omitFiltered`, fixes [#1018](https://github.com/badeball/cypress-cucumber-preprocessor/issues/1018).

## v17.1.0

- Add support for (testing) type-specific configuration, fixes [#700](https://github.com/badeball/cypress-cucumber-preprocessor/issues/700).

- Add support for component testing using Vite as bundler, fixes [#698](https://github.com/badeball/cypress-cucumber-preprocessor/issues/698).

- Output data tables in command log, fixes [#782](https://github.com/badeball/cypress-cucumber-preprocessor/issues/782) (by @nilgaar).

## v17.0.0

Breaking changes:

- Drop support for Cypress v9.

- Node v18 or beyond is now required.

- The package now utilizes [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) and you may have to set `moduleResolution` to `node16` in your `tsconfig.json` depending on what parts of the package you use (assuming you're using TypeScript).

  - TypeScript users that are unable to upgrade `moduleResolution` to `node16`, can use the `paths` property as a workaround, like shown below.

    ```
    {
      "compilerOptions": {
        "paths": {
          "@badeball/cypress-cucumber-preprocessor/*": ["./node_modules/@badeball/cypress-cucumber-preprocessor/dist/bundler-utils/*"]
        }
      }
    }
    ```

Other changes:

- Detect erroneous use of async / await and fail fast, relates to [#903](https://github.com/badeball/cypress-cucumber-preprocessor/issues/903).

- More precise snippet suggestions, fixes [#974](https://github.com/badeball/cypress-cucumber-preprocessor/issues/974).

- Report resolved configuration correctly, fixes [#951](https://github.com/badeball/cypress-cucumber-preprocessor/issues/951).

- Visualize hook filters properly, fixes [#922](https://github.com/badeball/cypress-cucumber-preprocessor/issues/922).

- Handle re-runs gracefully, fixes [#944](https://github.com/badeball/cypress-cucumber-preprocessor/issues/944).

This version contains some significant changes to the implementation, specifically regarding Cucumber messages. The backend is now more stateful to handle corner cases. However, the backend is also less forgivable than before. Thus, I (the author) expect some issues to arise out of this. If you have found an issue with this version, please open up a ticket.

## v16.0.3

- Update dependency on `@badeball/cypress-configuration`, fixing an issue where specs in node_modules weren't ignored.

## v16.0.2

- Correct an issue inhibiting users of `type: module` -projects from using the diagnostics utility ([#971](https://github.com/badeball/cypress-cucumber-preprocessor/pull/971)).

## v16.0.1

- Correctly set `willBeRetried` non-retried tests, fixes [#977](https://github.com/badeball/cypress-cucumber-preprocessor/issues/977).

## v16.0.0

- Correctly set `willBeRetried` in messages reports, fixes [#849](https://github.com/badeball/cypress-cucumber-preprocessor/issues/849).

- Replace [cucumber-json-formatter](https://github.com/cucumber/json-formatter) with native components, relates to [#795](https://github.com/badeball/cypress-cucumber-preprocessor/issues/795), [#827](https://github.com/badeball/cypress-cucumber-preprocessor/issues/827), [#870](https://github.com/badeball/cypress-cucumber-preprocessor/issues/870), [#966](https://github.com/badeball/cypress-cucumber-preprocessor/issues/966) and [#967](https://github.com/badeball/cypress-cucumber-preprocessor/issues/967).

  - This removes the need to install `cucumber-json-formatter` in order to generate JSON reports.

  - This removes the options `json.formatter` and `json.args`, which are no longer relevant. With the native components, no child process is spawned.

  - ~~If you previously had configured `specPattern` to equal `**/*.feature` (or similar), then you should change it to `cypress/e2e/**/*.feature` in order to not accidentally include feature files located in `node_modules`. This will otherwise interfere with the calculation of the *common ancestor path* and thus step definition resolution.~~

    - This is no longer necessary as of v16.0.3.

- Use deterministic, internal IDs, fixes [#948](https://github.com/badeball/cypress-cucumber-preprocessor/issues/948) to some degree..

## v15.1.5

- Correctly escape injected values to glob patterns, fixes [#946](https://github.com/badeball/cypress-cucumber-preprocessor/issues/946).

## v15.1.4

- Handle rescued test errors without self erroring, fixes [#856](https://github.com/badeball/cypress-cucumber-preprocessor/issues/856).

## v15.1.3

- Ensure attachments are correctly added to HTML reports in case of retries, fixes [#931](https://github.com/badeball/cypress-cucumber-preprocessor/issues/931).

## v15.1.2

- Limit the size of internal variables contained within the Cypress environment, fixes [#908](https://github.com/badeball/cypress-cucumber-preprocessor/issues/908).

## v15.1.1

- Log hooks using log groups as well, fixes [#922](https://github.com/badeball/cypress-cucumber-preprocessor/issues/922).

## v15.1.0

- Log steps and commands using log groups, fixes [#796](https://github.com/badeball/cypress-cucumber-preprocessor/issues/796).

## v15.0.0

- Drop support for Cypress v8.

- Add support for Cypress v12.

## v14.0.0

- Drop support for Cypress v7.

- Add support for Cypress v11.

## v13.1.0

- Better support for worlds in TypeScript, fixes [#864](https://github.com/badeball/cypress-cucumber-preprocessor/issues/864).

- Extended documentation, particularly in regards to pairing step definitions.

## v13.0.3

- Performance improvements to diagnostics.

## v13.0.2

- Correctly assign `testState.pickleStep`, fixes [#836](https://github.com/badeball/cypress-cucumber-preprocessor/issues/836).

## v13.0.1

- Support absolute paths in `stepDefinitions`, fixes [#832](https://github.com/badeball/cypress-cucumber-preprocessor/issues/832).

## v13.0.0

- Add a very rudimentary way of diagnosing validity of steps, IE. whether each step is matching one, and only one, step definition, fixes [#754](https://github.com/badeball/cypress-cucumber-preprocessor/issues/754).

- Remove `And` and `But` from the public API, fixes [#821](https://github.com/badeball/cypress-cucumber-preprocessor/issues/821).

- Output snippet suggestions upon missing step definition, fixes [#799](https://github.com/badeball/cypress-cucumber-preprocessor/issues/799).

## v12.2.0

- Total execution time is correctly shown in HTML reports, fixes [#813](https://github.com/badeball/cypress-cucumber-preprocessor/issues/813).

- Validate inclusion of `addCucumberPreprocessorPlugin()` in `setupNodeEvents()`, fixes [#820](https://github.com/badeball/cypress-cucumber-preprocessor/issues/820).

## v12.1.0

- Start time and execution time is shown in HTML reports, fixes [#798](https://github.com/badeball/cypress-cucumber-preprocessor/issues/798).

- Add current step information to `window.testState`, fixes [#800](https://github.com/badeball/cypress-cucumber-preprocessor/issues/800).

## v12.0.1

- Allow overriding env using tags, fixes [#792](https://github.com/badeball/cypress-cucumber-preprocessor/issues/792).

- Correct some path handling on Windows, fixes [#788](https://github.com/badeball/cypress-cucumber-preprocessor/issues/788).

- Correct calculation of common ancestor path, even when specs are filtered, fixes [#785](https://github.com/badeball/cypress-cucumber-preprocessor/issues/785).

## v12.0.0

Breaking changes:

- A minor change to step definitions has been introduced, affecting users of Cypress v10 or higher. When upgrading to v11.0.0 of the processor, users was instructed to [remove certain prefixes](https://github.com/badeball/cypress-cucumber-preprocessor/releases/tag/v11.0.0) from their step definitions. This is no longer required and said prefixes can be re-introduced when upgrading to v12.0.0 of the preprocessor. In other words, if your configuration looks like this

```json
{
  "stepDefinitions": [
    "[filepath].{js,ts}",
    "cypress/support/step_definitions/**/*.{js,ts}"
  ]
}
```

.. then it should now look like this (notice the addition of `cypress/e2e`)

```json
{
  "stepDefinitions": [
    "cypress/e2e/[filepath].{js,ts}",
    "cypress/support/step_definitions/**/*.{js,ts}"
  ]
}
```

Note: Step definitions doesn't necessarily have to be put in `cypress/e2e` and alongside your feature files. They can be contained in an entirely separate directory, if desired. This fixes [#748](https://github.com/badeball/cypress-cucumber-preprocessor/issues/748).

Other changes:

- Updated all `@cucumber/*` dependencies.

- Added native support for HTML reports using `@cucumber/html-formatter`, fixes [#780](https://github.com/badeball/cypress-cucumber-preprocessor/issues/780).

- Correct an issue with non-array `stepDefinitions`, fixes [#781](https://github.com/badeball/cypress-cucumber-preprocessor/issues/781).

## v11.5.1

- Expose member `getStepDefinitionPatterns`.

## v11.5.0

- Improve error message upon missing step definition, fixes [#763](https://github.com/badeball/cypress-cucumber-preprocessor/issues/763).

## v11.4.0

- Step definition with extension `.tsx` is picked up by default, paving the way for component testing.

- Added an example illustrating component testing with React + Webpack.

## v11.3.1

- Retried test would eventually yield "No commands were issued in the test", fixes [#749](https://github.com/badeball/cypress-cucumber-preprocessor/issues/749).

## v11.3.0

- Enable configuring of JSON args, allowing for custom JSON formatters, fixes [#742](https://github.com/badeball/cypress-cucumber-preprocessor/pull/742).

## v11.2.0

- Enable `*.mjs` file extension by default, when looking for step definitions.

- Add a default export to `@badeball/cypress-cucumber-preprocessor/esbuild`.

- Add examples for CJS and ESM.

## v11.1.0

- Enable test configuration overrides, such as retrability of a single scenario, fixes [#697](https://github.com/badeball/cypress-cucumber-preprocessor/issues/697).

## v11.0.0

Breaking changes:

- Dropped support for Cypress v6.

Other changes:

- Added support for Cypress v10. :tada:

- Untitled scenario outline no longer errors, fixes [#731](https://github.com/badeball/cypress-cucumber-preprocessor/issues/731).

- Outputting *only* messages is now possible, fixes [#724](https://github.com/badeball/cypress-cucumber-preprocessor/issues/724).

- Allow absolute output paths, partially fixes [#736](https://github.com/badeball/cypress-cucumber-preprocessor/issues/736).

- Output directories are automatically created recursively, partially fixes [#736](https://github.com/badeball/cypress-cucumber-preprocessor/issues/736).

### Upgrading to Cypress v10

There's no changes to configuration options, but if your configuration looked like this pre-10

```json
{
  "stepDefinitions": [
    "cypress/integration/[filepath].{js,ts}",
    "cypress/support/step_definitions/**/*.{js,ts}"
  ]
}
```

.. then it should look like this post-10 (notice the removal of `cypress/integration`)

```json
{
  "stepDefinitions": [
    "[filepath].{js,ts}",
    "cypress/support/step_definitions/**/*.{js,ts}"
  ]
}
```

## v10.0.2

- Allow integration folders outside of project root, fixes [#719](https://github.com/badeball/cypress-cucumber-preprocessor/issues/719).

## v10.0.1

- Fixed an [issue](https://github.com/badeball/cypress-cucumber-preprocessor/issues/720) where internal calls to `cy.wrap` was being logged.

## v10.0.0

Breaking changes:

- Exported member `resolvePreprocessorConfiguration` now *requires* a `projectRoot` variable and a `environment` variable.

Other changes:

- Configuration values can now be overriden using (Cypress-) [environment variable](https://docs.cypress.io/guides/guides/environment-variables).

## v9.2.1

- Fixed an [issue](https://github.com/badeball/cypress-cucumber-preprocessor/issues/713) with returning chainables from step definitions.

## v9.2.0

- Allow handlers to be omitted and attached explicitly, fixes [#705](https://github.com/badeball/cypress-cucumber-preprocessor/issues/705) (undocumented, experimental and API is subject to change anytime).

## v9.1.3

- Fixed an [issue](https://github.com/badeball/cypress-cucumber-preprocessor/issues/704) where programmatically skipping a test would error.

## v9.1.2

- Fixed an [issue](https://github.com/badeball/cypress-cucumber-preprocessor/issues/701) where Before hooks would error.

## v9.1.1

- Add timestamps and durations to messages.

## v9.1.0

- Automatically skip tests marked with `@skip`.

## v9.0.5

- Correct types for `isFeature` and `doesFeatureMatch`.

## v9.0.4

- Prevent an error when `experimentalInteractiveRunEvents` is enabled.

## v9.0.3

- Fixed an issue where the preprocessor was throwing in interactive mode when JSON reports was enabled.

## v9.0.2

- Fixed an [issue](https://github.com/badeball/cypress-cucumber-preprocessor/issues/694) when running all specs.

## v9.0.1

Due to an publishing error from my side, this version is identical to v9.0.0.

## v9.0.0

This is the point where [badeball](https://github.com/badeball)'s fork becomes the mainline and replaces [TheBrainFamily](https://github.com/TheBrainFamily)'s implementation. This implementation has been re-written from scratch in TypeScript, has more thorough test coverage and is filled with a bunch of new feature. Read more about the transfer of ownership [here](https://github.com/badeball/cypress-cucumber-preprocessor/issues/689).

The changelog of the two ancestors can be found at

- [TheBrainFamily's history / changelog](https://github.com/badeball/cypress-cucumber-preprocessor/blob/7031d0283330bca814d6923d35d984224622b4cf/CHANGELOG.md)
- [badeball's history / changelog](https://github.com/badeball/cypress-cucumber-preprocessor/blob/v9.0.0/CHANGELOG.md)
