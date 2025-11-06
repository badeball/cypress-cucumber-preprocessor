[← Back to documentation](readme.md)

# Dry run

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

Dry run is a run mode in which no steps or any type of hooks are executed. A few examples where this is useful:

- Finding unused step definitions with [usage reports](usage-report.md)
- Generating snippets for all undefined steps
- Checking if your path, tag expression, etc. matches the scenarios you expect it to

Dry run can be enabled using `dryRun`, like seen below.

```
$ cypress run --env dryRun=true
```
