[← Back to documentation](readme.md)

# Messages reports

"Messages" refers to [Cucumber Messages](https://github.com/cucumber/common/tree/main/messages) and is a low-level report / protocol for representing results and other information from Cucumber. JSON reports and HTML reports are derived from this report. Hence, messages report will implicitly be enabled if either of the mentioned reports are.

Messages reports can be enabled using the `messages.enabled` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. An example configuration is shown below.

```json
{
  "messages": {
    "enabled": true
  }
}
```

The report is outputted to `cucumber-messages.ndjson` in the project directory, but can be configured through the `messages.output` property.

## Screenshots

Screenshots are automatically added to messages reports, including that of failed tests (unless you have disabled `screenshotOnRunFailure`). This can be turned off using the `attachments.addScreenshots` property, which defaults to `true`.

## Attachments

Attachments can also be added to messages reports through an API. This API is further explained in [JSON report](json-report.md), but applies to messages reports as well.
