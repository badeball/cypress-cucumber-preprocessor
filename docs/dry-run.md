[← Back to documentation](readme.md)

# Dry run

Dry run is a run mode in which no steps or any type of hooks are executed. A few examples where this is useful:

- Finding unused step definitions with [usage reports](usage-report.md)
- Generating snippets for all undefined steps
- Checking if your path, tag expression, etc. matches the scenarios you expect it to

Dry run can be enabled using `dryRun`, like seen below.

```sh
# For users of Cypress v15.17 and above
$ cypress run --expose dryRun=true
# For users of Cypress v15.16 and below
$ cypress run --env dryRun=true
```
