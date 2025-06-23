[← Back to documentation](readme.md)

# Configuration

The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`, with corresponding examples shown below.

```
// .cypress-cucumber-preprocessorrc.json
{
  "json": {
    "enabled": true
  }
}
```

```
// package.json
{
  "dependencies": {
    "@badeball/cypress-cucumber-preprocessor": "latest"
  },
  "cypress-cucumber-preprocessor": {
    "json": {
      "enabled": true
    }
  }
}
```

## Type-specific configuration

Configuration values for specific types of testing (e2e / component) can be configured using respective blocks, like shown below.

```
// .cypress-cucumber-preprocessorrc.json
{
  "e2e": {
    "stepDefinitions": "cypress/e2e/[filepath].{js,mjs,ts,tsx}"
  },
  "component": {
    "stepDefinitions": "src/[filepath].{js,mjs,ts,tsx}"
  }
}
```

## Caveats / Debugging

Notice that configuration, when `package.json` is used, **must** be placed within the `"cypress-cucumber-preprocessor": { .. }` block. This does not apply if EG. `.cypress-cucumber-preprocessorrc.json` is used, as this is a file solely dedicated to preprocessor configuration, while `package.json` is not.

If you place configuration values in multiple locations, *only one* of them will apply and take affect. The implication of this is that if you have an empty `"cypress-cucumber-preprocessor": { .. }` block within your `package.json` and try to write another configuration file, then you will be surprised to find that nothing seems to work.

If you're unsure of what configuration values is actually being applied, then you can run Cypress with the following to enable debug output which will tell you.

```
$ DEBUG=cypress:electron,cypress-configuration,cypress-cucumber-preprocessor cypress run
```

## Configuration overrides

Configuration options can be overridden using (Cypress-) [environment variable](https://docs.cypress.io/guides/guides/environment-variables). The `filterSpecs` options (described in [docs/tags.md](tags.md)) can for instance be overridden by running Cypress like shown below.

```
$ cypress run -e filterSpecs=true
```

Cypress environment variables can also be configured through ordinary environment variables, like shown below.

```
$ CYPRESS_filterSpecs=true cypress run
```

Every configuration option has a similar key which can be use to override it, shown in the table below.

| JSON path                    | Environment key             | Example(s)                               |
|------------------------------|-----------------------------|------------------------------------------|
| `stepDefinitions`            | `stepDefinitions`           | `[filepath].{js,ts}`                     |
| `messages.enabled`           | `messagesEnabled`           | `true`, `false`                          |
| `messages.output`            | `messagesOutput`            | `cucumber-messages.ndjson`               |
| `json.enabled`               | `jsonEnabled`               | `true`, `false`                          |
| `json.output`                | `jsonOutput`                | `cucumber-report.json`                   |
| `html.enabled`               | `htmlEnabled`               | `true`, `false`                          |
| `html.output`                | `htmlOutput`                | `cucumber-report.html`                   |
| `usage.enabled`              | `usageEnabled`              | `true`, `false`                          |
| `usage.output`               | `usageOutput`               | `stdout`                                 |
| `pretty.enabled`             | `prettyEnabled`             | `true`, `false`                          |
| `filterSpecsMixedMode`       | `filterSpecsMixedMode`      | `hide`, `show`, `empty-set`              |
| `filterSpecs`                | `filterSpecs`               | `true`, `false`                          |
| `omitFiltered`               | `omitFiltered`              | `true`, `false`                          |
| `dryRun`                     | `dryRun`                    | `true`, `false`                          |
| `attachments.addScreenshots` | `attachmentsAddScreenshots` | `true`, `false`                          |

## Test configuration

Some of Cypress' [configuration options](https://docs.cypress.io/guides/references/configuration) can be overridden per-test, see [Test configuration](test-configuration.md).
