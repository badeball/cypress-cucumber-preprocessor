[← Back to documentation](readme.md)

# Usage reports

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

> :warning: This requires you to have [source maps](source-maps.md) enabled.

The usage report lists your step definitions and tells you about usages in your scenarios, including the duration of each usage, and any unused steps. Here's an example of the output:

```
┌───────────────────────────────────────┬──────────┬─────────────────────────────────┐
│ Pattern / Text                        │ Duration │ Location                        │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ an empty todo list                    │ 760.33ms │ support/steps/steps.ts:6        │
│   an empty todo list                  │ 820ms    │ features/empty.feature:4        │
│   an empty todo list                  │ 761ms    │ features/adding-todos.feature:4 │
│   an empty todo list                  │ 700ms    │ features/empty.feature:4        │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ I add the todo {string}               │ 432.00ms │ support/steps/steps.ts:10       │
│   I add the todo "buy some cheese"    │ 432ms    │ features/adding-todos.feature:5 │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ my cursor is ready to create a todo   │ 53.00ms  │ support/steps/steps.ts:27       │
│   my cursor is ready to create a todo │ 101ms    │ features/empty.feature:10       │
│   my cursor is ready to create a todo │ 5ms      │ features/adding-todos.feature:8 │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ no todos are listed                   │ 46.00ms  │ support/steps/steps.ts:15       │
│   no todos are listed                 │ 46ms     │ features/empty.feature:7        │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ the todos are:                        │ 31.00ms  │ support/steps/steps.ts:21       │
│   the todos are:                      │ 31ms     │ features/adding-todos.feature:6 │
├───────────────────────────────────────┼──────────┼─────────────────────────────────┤
│ I remove the todo {string}            │ UNUSED   │ support/steps/steps.ts:33       │
└───────────────────────────────────────┴──────────┴─────────────────────────────────┘
```

Usage reports can be enabled using the `usage.enabled` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. An example configuration is shown below.

```json
{
  "usage": {
    "enabled": true
  }
}
```

The report is outputted to stdout (your console) by default, but can be configured to be written to a file through the `usage.output` property.
