[← Back to documentation](readme.md)

# JSON formatter

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

JSON reports are [natively supported](json-report.md) through configuration. **This is sufficient for almost everyone and you should think twice before reading any further.** You do however have the option to manually convert messages into JSON reports using the following executable. The JSON formatter consumes messages from stdin and outputs its report to stdout, like shown below.

```
$ npx cucumber-json-formatter < cucumber-messages.ndjson
{
  ...
}
```

Alternatively you can redirect the output to a new file.

```
$ npx cucumber-json-formatter < cucumber-messages.ndjson > cucumber-report.json
```
