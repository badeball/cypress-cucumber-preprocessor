[← Back to documentation](readme.md)

# JSON reports

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

JSON reports can be enabled using the `json.enabled` property. The preprocessor uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which means you can place configuration options in EG. `.cypress-cucumber-preprocessorrc.json` or `package.json`. An example configuration is shown below.

```json
{
  "json": {
    "enabled": true
  }
}
```

The report is outputted to `cucumber-report.json` in the project directory, but can be configured through the `json.output` property.

## Screenshots

Screenshots are automatically added to JSON reports, including that of failed tests (unless you have disabled `screenshotOnRunFailure`). This can be turned off using the `attachments.addScreenshots` property, which defaults to `true`.

## Attachments (browser environment)

Text, images and other data can be added to the output of the messages and JSON reports with attachments, using the browser API explained below.

```ts
import { Given, attach } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  attach("foobar");
});
```

By default, text is saved with a MIME type of text/plain. You can also specify a different MIME type as part of a second argument.

```ts
import { Given, attach } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  attach('{ "name": "foobar" }', { mediaType: "application/json" });
});
```

If you'd like, you can also specify a filename to be used if the attachment is made available to download as a file via a formatter.

```ts
import { Given, attach } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  attach('{ "name": "foobar" }', {
    mediaType: "application/json",
    fileName: "results.json"
  });
});
```

Images and other binary data can be attached using a ArrayBuffer. The data will be base64 encoded in the output.

```ts
import { Given, attach } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  attach(new TextEncoder().encode("foobar").buffer, { mediaType: "text/plain" });
});
```

If you've already got a base64-encoded string, you can prefix your mime type with `base64:` to indicate this.

```ts
import { Given, attach } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  attach("Zm9vYmFy", { mediaType: "base64:text/plain" });
});
```

## Attachments (node environment)

Similar to the browser API explained above, attachments can also be added using a Node API. This is less typical and only required in specific scenarios. This API is available through the `onAfterStep` option in `addCucumberPreprocessorPlugin`, like shown below. The Node API mimicks the options found in the browser API.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach }) {
    attach("foobar");
  }
});
```

By default, text is saved with a MIME type of text/plain. You can also specify a different MIME type as part of a second argument.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach }) {
    attach('{ "name": "foobar" }', { mediaType: "application/json" });
  }
});
```

If you'd like, you can also specify a filename to be used if the attachment is made available to download as a file via a formatter.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach }) {
    attach('{ "name": "foobar" }', {
      mediaType: "application/json"
      fileName: "results.json"
    });
  }
});
```

Images and other binary data can be attached using a Buffer. The data will be base64 encoded in the output.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach }) {
    attach(Buffer.from("foobar"), { mediaType: "text/plain" });
  }
});
```

If you've already got a base64-encoded string, you can prefix your mime type with `base64:` to indicate this.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach }) {
    attach("Zm9vYmFy", { mediaType: "base64:text/plain" });
  }
});
```

The hook is furthermore invoked with a bunch of other, relevant data, similar to `AfterStep(..)`, with the addition of a `result` property.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ pickle, pickleStep, gherkinDocument, testCaseStartedId, testStepId, result }) {}
});
```

This information can, among other things, be used to determine if a step was the last step, like shown below.

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ attach, pickle, pickleStep }) {
    const wasLastStep =
      pickle.steps[pickle.steps.length - 1] === pickleStep;

    if (wasLastStep) {
      attach("foobar");
    }
  }
});
```

## Logging

You can log useful information from your support code with the simple `log` function. This is available in both the browser and node environment.

```ts
import { Given, log } from "@badeball/cypress-cucumber-preprocessor";

Given("a step", function() {
  log("Something interesting happened!");
});
```

```ts
await addCucumberPreprocessorPlugin(on, config, {
  onAfterStep({ log }) {
    log("Something interesting happened!");
  }
});
```

Anything you log will be attached as a string with a MIME type of `text/x.cucumber.log+plain`.
