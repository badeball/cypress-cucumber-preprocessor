[← Back to documentation](readme.md)

# Step definitions

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

Step definitions are resolved using search paths that are configurable through the `stepDefinitions` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. The default (almost true[^1]) search paths are shown below.

```json
{
  "stepDefinitions": [
    "cypress/e2e/[filepath]/**/*.{js,ts}",
    "cypress/e2e/[filepath].{js,ts}",
    "cypress/support/step_definitions/**/*.{js,ts}",
  ]
}
```

The default configuration means that if you have a file `cypress/e2e/duckduckgo.feature`, it will match step definitions found in

* `cypress/e2e/duckduckgo/steps.ts`
* `cypress/e2e/duckduckgo.ts`
* `cypress/support/step_definitions/duckduckgo.ts`

## Pairing explained

From Cucumber you might be familiar with the fact that step definitions *aren't* linked to particular feature files, as per their [docs](https://cucumber.io/docs/cucumber/step-definitions):

> Step definitions aren’t linked to a particular feature file or scenario. The file, class or package name of a step definition does not affect what Gherkin steps it will match. The only thing that matters is the step definition’s expression.

This is *not* true for the preprocessor and represents the only place where the two experiences (Cucumber vs. Cypress + this preprocessor) deviates significantly. However, the preprocessor don't magically understand your intention in regards to this.

**Pairing** dictates which step definitions will be available in which feature files. Furthermore, hooks specified in paired files are the hooks which will take effect. Pairing is entirely configured through the `stepDefinitions` property. Below are some examples to further explain this concept.

A prerequisite for understanding this process is some knowledge of glob / search patterns. Explaining this however is out of the scope is this page. Internally, [glob](https://github.com/isaacs/node-glob) is used.

### Example 1: Templating introduced

Let's consider the following directory structure.

```
/home/john.doe/my-project
└── cypress
    └── e2e
        ├── foo
        │   ├── a.feature
        │   └── a.js
        └── bar
            ├── b.feature
            └── b.js
```

.. and a configuration `{ "stepDefinitions": ["cypress/e2e/[filepath].js"] }`. The following is what happens when you run `a.feature`:

1. The project root (`"/home/john.doe/my-project"`) is subtracted from the full path of the feature file, leaving us with with `"cypress/e2e/foo/a.feature"`.
2. The *integration directory* (`"cypress/e2e"`) is subtracted from above result, resulting in `"foo/a.feature"`.
   - For Cypress v9 users and below, the *integration directory* is an explicitly configured path.
   - For Cypress v10 users and higher, this is implicitly calculated and is the *common ancestor path* of all feature files found. For the example above, this is `"cypress/e2e"`. Thus we're left with `"foo/a.feature"`.
3. The file extension is removed, leaving us with `"foo/a"`.

The last value is used to replace `[filepath]` in each member of the configured `stepDefinitions`. For our example above this would yield `["cypress/e2e/foo/a.js"]`. This resulting array is used as search patterns for files containing step definitions (internally using [glob](https://github.com/isaacs/node-glob)).

When `a.feature` is run, the preprocessor will only look for step definitions in `cypress/e2e/foo/a.js`. Furthermore, only hooks defined in said file will take effect. The feature file is now said to be *paired* with that file containing step definitions.

The observant reader will now understand that the `[filepath]` template value allows you to create a hierarchy of step definitions that matches the structure of your feature files. It also allows to you put step definitions in an entirely separate directory.

### Example 2: Directory with common step definitions

Let's now consider the following directory structure.

```
/home/john.doe/my-project
└── cypress
    └── e2e
        ├── foo
        │   ├── a.feature
        │   └── a.js
        ├── bar
        │   ├── b.feature
        │   └── b.js
        └── common-step-definitions
            ├── 1.js
            └── 2.js
```

Using the *same* value `stepDefinitions` as before, the preprocessor would *not* be able to resolve any files in `cypress/e2e/common-step-definitions`. This is likely not what you want, but we can add a member to the configuration value, as shown below.

```
{
  "stepDefinitions": [
    "cypress/e2e/[filepath].js",
    "cypress/e2e/common-step-definitions/*.js"
  ]
}
```

When running `a.feature`, we know from the previous example that the first member of the array would yield the search pattern `cypress/e2e/foo/a.js`, which correctly matches one of our files.

The least member however, obeys to the same rules and goes to the same string replacement process described previously. It doesn't contain `[filepath]`, but that doesn't matter. The resulting search pattern is `"cypress/e2e/common-step-definitions/*.js"`, which is provided to [glob](https://github.com/isaacs/node-glob) and would yield `1.js` and `2.js`.

All of these three files are now said to be *paired* with `a.feature`. Hooks in `b.js` will not be available when running `a.feature` and its hooks will not take effect.

### Example 3: A common mistake

Now let's consider the *same* file & directory structure as in the previous example, but the following configuration.

```
{
  "stepDefinitions": [
    "cypress/e2e/**/*.js"
  ]
}
```

The single value will go through the string replacement process and yield itself, because it does not contain the string `[filepath]`. The value will then be propagated to [glob](https://github.com/isaacs/node-glob), which will find *every* `.js` file in the hierarchy.

You might initially be tempted to believe that you have configured the processor correctly, because your test might run at this point. However, step definitions from `b.js` will be available in `a.feature` and vice versa. Similarly, hooks in either file will always take effect.

### Example 4: Hierarchy

There's also a `[filepart]` option available (notice the subtle difference from `[filepath]`). Given a configuration shown below

```json
{
  "stepDefinitions": [
    "cypress/e2e/[filepart]/step_definitions/**/*.{js,ts}"
  ]
}
```

... and a feature file `cypress/e2e/foo/bar/baz.feature`. When running said feature file, the preprocessor would go through a process and replace `[filepath]` with `"foo/bar/baz"` in each member of the configuration (here a single value).

The `[filepart]` options works similarly, except that the previous mentioned value (`"foo/bar/baz"`) is further split into

- `"foo/bar/baz"`
- `"foo/bar"`
- `"foo"`
- `"."`

All of these will be used to replace `[filepart]`. Thus, a single configuration member would yield *four* values and use [glob](https://github.com/isaacs/node-glob) to search in

* `"cypress/e2e/foo/bar/baz/step_definitions/**/*.{js,ts}"`
* `"cypress/e2e/foo/bar/step_definitions/**/*.{js,ts}"`
* `"cypress/e2e/foo/step_definitions/**/*.{js,ts}"`
* `"cypress/e2e/step_definitions/**/*.{js,ts}"`

## Caveats

The library makes use of [glob](https://github.com/isaacs/node-glob) to turn patterns into a list of files. This has some implications, explained below (list is non-exhaustive and will be expanded on demand).

* Single term inside braces, EG. `foo/bar.{js}`, doesn't work as you might expect, ref. https://github.com/isaacs/node-glob/issues/434.

[^1]: I claim that the default configuration is of that below and this is almost always true.

    ```json
    {
      "stepDefinitions": [
        "cypress/e2e/[filepath]/**/*.{js,ts}",
        "cypress/e2e/[filepath].{js,ts}",
        "cypress/support/step_definitions/**/*.{js,ts}",
      ]
    }
    ```

    The reality is a bit more complex, in order to support a variety of use-cases out-of-the-box.
    Most users will place their feature files in `cypress/e2e` and in those cases, the default
    configuration will be that of my claim.

    However, users that decide on a different location, let's say. `cypress/features` - in their
    case, the default behavior of the preprocessor will be _as if_ you configured `stepDefinitions`
    shown like below.

    ```json
    {
      "stepDefinitions": [
        "cypress/features/[filepath]/**/*.{js,ts}",
        "cypress/features/[filepath].{js,ts}",
        "cypress/support/step_definitions/**/*.{js,ts}",
      ]
    }
    ```

    Essentially, the first part of the two first elements, is determined finding out the common
    ancestor path of all your feature files and thus the default configuration is dynamic.
