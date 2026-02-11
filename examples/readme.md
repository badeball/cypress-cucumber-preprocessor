# Examples

These are the *only* official examples at the time of writing. Any other example you come across is **not official** and might be severely outdated by now.

## Usage with other plugins

If you're using the preprocessor _with other plugins_, please read [docs/event-handlers.md: On event handlers](../docs/event-handlers.md) **carefully**.

## E2E testing

The examples illustrates using each bundler in each language flavor.

|            | CJS                      | ESM                      | TS                       |
|------------|--------------------------|--------------------------|--------------------------|
| Browserify | :warning: Deprecated[^1] | :warning: Deprecated[^1] | :warning: Deprecated[^1] |
| Esbuild    | [Link](esbuild-cjs)      | [Link](esbuild-esm)      | [Link](esbuild-ts)       |
| Webpack    | [Link](webpack-cjs)      | [Link](webpack-esm)      | [Link](webpack-ts)       |

## Component testing

Component testing works with both Webpack and Vite[^2] as a bundler.

|                 | CJS                    | ESM                    | TS                          |
|-----------------|------------------------|------------------------|-----------------------------|
| React + Webpack |                        |                        | [Link](ct-webpack-react-ts) |
| React + Vite    |                        |                        | [Link](ct-vite-react-ts)    |

[patch-package]: https://github.com/ds300/patch-package
[^1]: Using Browserify as a bundler became deprecated with v24. To continue using it, you can pin your version of `@badeball/cypress-cucumber-preprocessor` to `~23.x.y`. See the FAQ for more information.
[^2]: Using Vite requires patching `@cypress/vite-dev-server`, something which is easily achieved using [`patch-package`][patch-package] as the example illustrates.
