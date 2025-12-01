[← Back to documentation](readme.md)

# HTML reports

HTML reports are powered by [`@cucumber/html-formatter`](https://github.com/cucumber/html-formatter). They can be enabled using the `html.enabled` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. An example configuration is shown below.

```json
{
  "html": {
    "enabled": true
  }
}
```

The report is outputted to `cucumber-report.html` in the project directory, but can be configured through the `html.output` property.

## Screenshots

Screenshots are automatically added to HTML reports, including that of failed tests (unless you have disabled `screenshotOnRunFailure`). This can be turned off using the `attachments.addScreenshots` property, which defaults to `true`.

## Videos

Videos are not automatically added to reports, but can be turned on using the `attachments.addVideos` property. This assumes you've configured Cypress to [capture videos](https://docs.cypress.io/app/guides/screenshots-and-videos#Videos). Videos are base-64 encoded and included in the files, which may affect size and performance.

## Attachments

Attachments can also be added to HTML reports through an API. This API is further explained in [JSON report](json-report.md), but applies to HTML reports as well.
