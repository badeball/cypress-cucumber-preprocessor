[← Back to documentation](readme.md)

# Mixing Cucumber and non-Cucumber specs

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

Mixing Cucumber and non-Cucumber specs are supported. Cypress can be configured with `specPattern` to resolve multiple spec types as shown below.

```js
export default defineConfig({
  e2e: {
    specPattern: "**/*.{spec.js,feature}"
  },
});
```

Cucumber hooks, IE. `Before` and `After` as imported from `@badeball/cypress-cucumber-preprocessor`, are *only* run in Cucumber-type specs.

You can determine spec-type in Cypress' own hooks using `isFeature()`, as shown below.

```js
import { isFeature } from "@badeball/cypress-cucumber-preprocessor";

beforeEach(() => {
  if (isFeature()) {
    // This is only run for Cucumber-type specs.
  }
})
```

You can also created conditions based on tags using `doesFeatureMatch(..)`, as shown below.

```js
import { isFeature, doesFeatureMatch } from "@badeball/cypress-cucumber-preprocessor";

beforeEach(() => {
  if (isFeature() && doesFeatureMatch("@foobar")) {
    // This is only run for Cucumber-type specs tagged with @foobar.
  }
})
```

:warning: You can however **not** invoke any other member from `@badeball/cypress-cucumber-preprocessor` (such as `Before(..)` or `Given(..)`) within non-Cucumber specs.
