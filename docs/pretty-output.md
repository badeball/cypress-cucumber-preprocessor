[← Back to documentation](readme.md)

# Pretty output

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

Pretty output is an alternative Cypress reporter which will print steps as they are executed, like shown below.

<p align="center">
  <img src="https://raw.github.com/badeball/cypress-cucumber-preprocessor/master/docs/pretty.gif" />
</p>

Pretty output can be turned on like shown below.

```ts
export default defineConfig({
  e2e: {
    reporter: require.resolve("@badeball/cypress-cucumber-preprocessor/pretty-reporter")
  },
});
```

If you do not have access to `require.resolve`, such as when configuring reporter from the command line, you can use the following path instead.

```
$ cypress run --reporter @badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/pretty-reporter.js
```

The reason for having to use `require.resolve` or a needlessly cumbersome path, is because a) this package's use of [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) and b) Cypress circumventing the built-in resolve mechanism in Node when loading reporters. This disables the use of [PnP](https://github.com/cypress-io/cypress/issues/18922), among other things, including making this a bit more difficult than it has to be.

> :pushpin: Combine pretty output with Cypress' own `-q / --quiet` option to obtain particularly terse output as seen in the animation above.

## Usage with `cypress-multi-reporters`

If you want to use pretty output with `cypress-multi-reporters`, presumably because you are using multiple reporters, then you **also** need to explicitly turn on the `pretty.enabled` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. An example configuration is shown below.

The reason for having to do this explicitly when using `cypress-multi-reporters`, is explained further below.

```
{
  "pretty": {
    "enabled": true
  }
}
```

### Explanation

This sections requires some technical introduction. The library assumes a couple of different roles and has code running in four primary places:

* As an esbuild plugin / vite plugin / webpack loader / browserify transform
* In the browser
* Within `setupNodeEvents() { .. }`
* As a reporter

A reporter doesn't have much knowledge about the tests or which steps they may consist of. Reporters are limited to the domain and events exhibited by [Mocha](https://mochajs.org/), which is unaware of Cucumber. Thus, most of the pretty output doesn't actually originate from the reporter.

Instead, use of `@badeball/cypress-cucumber-preprocessor/pretty-reporter` is detected by the part which runs within `setupNodeEvents() { .. }` and it's this code which is responsible for most of the pretty output.

This code however is unable to detect your intention of using pretty output if it's configured through `cypress-multi-reporters`. In the absence of being able to detect this, you can manually instruct the preprocessor to turn on pretty output by explicitly turning on `pretty.enabled`.
