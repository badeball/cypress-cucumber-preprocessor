# Examples

These are the *only* official examples at the time of writing. Any other example you come across is **not official** and might be severely outdated by now.

## Usage with other plugins

If you're using the preprocessor _with other plugins_, please read [docs/event-handlers.md: On event handlers](event-handlers.md) **carefully**.

## E2E testing

The examples illustrates using each bundler in each language flavor.

|            | CJS                    | ESM                    | TS                    |
|------------|------------------------|------------------------|-----------------------|
| Browserify | [Link](browserify-cjs) | [Link](browserify-esm) | [Link](browserify-ts) |
| Esbuild    | [Link](esbuild-cjs)    | [Link](esbuild-esm)    | [Link](esbuild-ts)    |
| Webpack    | [Link](webpack-cjs)    | [Link](webpack-esm)    | [Link](webpack-ts)    |

## Component testing

Component testing works with both Webpack and Vite as a bundler.

|                 | CJS                    | ESM                    | TS                          |
|-----------------|------------------------|------------------------|-----------------------------|
| React + Webpack |                        |                        | [Link](ct-webpack-react-ts) |
| React + Vite    |                        |                        | [Link](ct-vite-react-ts)    |
