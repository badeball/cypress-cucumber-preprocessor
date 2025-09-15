[← Back to documentation](readme.md)

# Frequently asked questions <!-- omit from toc -->

- [I get `fs_1.promises.rm is not a function`](#i-get-fs_1promisesrm-is-not-a-function)
- [I get `state.messages.current.findLastIndex is not a function`](#i-get-statemessagescurrentfindlastindex-is-not-a-function)
- [`--env` / `tags` isn't picked up](#--env--tags-isnt-picked-up)
- [Negated tags / complex tag expressions aren't working as expected on Windows](#negated-tags--complex-tag-expressions-arent-working-as-expected-on-windows)
- [JSON reports aren't generated in open / interactive mode](#json-reports-arent-generated-in-open--interactive-mode)
- [I get `cypress_esbuild_preprocessor_1.createBundler is not a function`](#i-get-cypress_esbuild_preprocessor_1createbundler-is-not-a-function)
- [I get `cypress_esbuild_preprocessor_1.default is not a function`](#i-get-cypress_esbuild_preprocessor_1default-is-not-a-function)
- [I get `Cannot find module '@badeball/cypress-cucumber-preprocessor/esbuild'`](#i-get-cannot-find-module-badeballcypress-cucumber-preprocessoresbuild)
- [My JSON report isn't generated in run mode](#my-json-report-isnt-generated-in-run-mode)
- [I get `Unexpected state in <state-handler>: <state>`](#i-get-unexpected-state-in-state-handler-state)
- [I get `Webpack Compilation Error` (shown below)](#i-get-webpack-compilation-error-shown-below)
- [Why is `cypress-tags` missing?](#why-is-cypress-tags-missing)
- [Function members `And(..)` and `But(..)` are missing](#function-members-and-and-but-are-missing)
- [Which preprocessor version should I choose?](#which-preprocessor-version-should-i-choose)

<!-- Node requirements -->

## I get `fs_1.promises.rm is not a function`

Upgrade your node version to v18.0.0, which is the minimum required version.

## I get `state.messages.current.findLastIndex is not a function`

Upgrade your node version to v18.0.0, which is the minimum required version.

<!-- Cypress oddities -->

## `--env` / `tags` isn't picked up

This might be because you're trying to specify `-e / --env` multiple times, but [multiple values should be comma-separated](https://docs.cypress.io/guides/guides/command-line#cypress-run-env-lt-env-gt).

## Negated tags / complex tag expressions aren't working as expected on Windows

Windows / CMD.EXE users must be aware that single-quotes bear no special meaning and should not be used to group words in your shell. For these users, only double-quotes should be used for this purpose. What this means is that, for these users, running `cypress run --env tags='not @foo'` <ins>is not going to behave</ins> and double-quotes must be used. Furthermore, similar scripts contained in `package.json` should also use double-quotes (escaped necessarily, as that is JSON).

## JSON reports aren't generated in open / interactive mode

JSON reports aren't generated in open / interactive mode. They rely on some events that aren't available in open-mode, at least not without `experimentalInteractiveRunEvents: true`. However, this experimental flag broke some time ago, ref. [cypress-io/cypress#18955](https://github.com/cypress-io/cypress/issues/18955), [cypress-io/cypress#26634](https://github.com/cypress-io/cypress/issues/26634). There's unfortunately little indication that these issues will be fixed and meanwhile reports will not be available in open / interactive mode.

<!-- TypeScript related -->

## I get `cypress_esbuild_preprocessor_1.createBundler is not a function`

This can happen if you have a TypeScript Cypress configuration (IE. `cypress.config.ts` as opposed to `cypress.config.js`) similar to one of our examples and have a `tsconfig.json` _without_ `{ "compilerOptions": { "esModuleInterop": true } }`.

If you're really adamant about _not_ using `esModuleInterop: true`, you can change

```ts
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
```

.. to

```ts
import * as createBundler from "@bahmutov/cypress-esbuild-preprocessor";
```

However, I recommend just using `esModuleInterop: true` if you don't fully understand the implications of disabling it.

## I get `cypress_esbuild_preprocessor_1.default is not a function`

See answer above.

## I get `Cannot find module '@badeball/cypress-cucumber-preprocessor/esbuild'`

Set `compilerOptions.moduleResolution` to `node16` in your `tsconfig.json`. Users that are unable to upgrade `moduleResolution` to `node16`, can use the `paths` property as a workaround, like shown below.

```
{
  "compilerOptions": {
    "paths": {
      "@badeball/cypress-cucumber-preprocessor/*": ["./node_modules/@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/*"]
    }
  }
}
```

<!-- On event handlers -->

## My JSON report isn't generated in run mode

You may have stumbled upon a configuration caveat (see [docs/configuration.md: Caveats / Debugging](configuration.md#caveats--debugging)) or are overriding some of the plugin's own event handlers (see [docs/event-handlers.md: On event handlers](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/event-handlers.md)).

## I get `Unexpected state in <state-handler>: <state>`

You might be overriding some of the plugin's own event handlers (see [docs/event-handlers.md: On event handlers](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/event-handlers.md)).

If that's not the case, you might've come across a bug in the preprocessor. If you intend to create a ticket, you <ins>have to</ins> provide a *reproducible example*. Sometimes it might not be clear what happens when these errors are produced, especially if they're intermittent.

In that case you can turn on "soft errors", which means that they *won't* halt the execution. This in turn *might* help you understand your edge case and thus help your provide a reproducible example. This option can be configured like shown below.

```
// package.json
{
  "dependencies": {
    "@badeball/cypress-cucumber-preprocessor": "latest"
  },
  "cypress-cucumber-preprocessor": {
    "state": {
      "softErrors": true
    }
  }
}
```

```
// .cypress-cucumber-preprocessorrc.json
{
  "state": {
    "softErrors": true
  }
}
```

```
$ cypress run -e stateSoftErrors=true
```

```
$ env CYPRESS_stateSoftErrors=true cypress run
```

<!-- Configuration issues -->

## I get `Webpack Compilation Error` (shown below)

```
Error: Webpack Compilation Error
Module parse failed: Unexpected token (2:21)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
```

This virtually always means that you have misconfigured `@cypress/webpack-preprocessor`. [Here's](https://github.com/badeball/cypress-cucumber-preprocessor/blob/v20.1.0/examples/webpack-cjs/cypress.config.js#L20-L28) an example of the crucial configuration value, for which when missing generates the error above.

This is usually seen when users are diverging from the [examples](https://github.com/badeball/cypress-cucumber-preprocessor/tree/master/examples) by EG. placing preprocessor configuration in `cypress/plugins/index.js` (which some blog posts reference despite this being deprecated) or by placing webpack-specific content in `webpack.config.js` (or similar) and *not* referencing this file in `cypress.config.js`.

<!-- Feature deprecations -->

## Why is `cypress-tags` missing?

The `cypress-tags` executable has been removed and made redundant. Specs containing no matching scenarios are [automatically filtered](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/tags.md#running-a-subset-of-scenarios), provided that `filterSpecs` is set to true.

## Function members `And(..)` and `But(..)` are missing

These have been [deprecated](https://github.com/badeball/cypress-cucumber-preprocessor/issues/821) to reflect cucumber-js' behavior. You can still however use the `And` keyword in `.feature` files. As explained on [SO](https://stackoverflow.com/questions/24747464/how-to-use-and-in-a-gherkin-using-cucumber-js#comment38690100_24748612),

> `And` is only used in scenarios, not as step definition methods. Semantically it means "same keyword as in previous step"; technically it is just another step. In fact, you can use `Given()`, `When()` and `Then()` interchangeably in your step definitions, Cucumber will not enforce a match between the step keyword and the step definition function.

## Which preprocessor version should I choose?

The observant reader might have noticed that there's a NPM package named `cypress-cucumber-preprocessor` and `@badeball/cypress-cucumber-preprocessor`. This is merely a result of maintainer and ownership transfer. The package `cypress-cucumber-preprocessor` is severely outdated by now and as far as I (the current maintainer) know, there's no reason to be using it.

In any case, choose one over the other and don't attempt to mix these, essentially different packages, in the same project.
