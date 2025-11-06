[← Back to documentation](readme.md)

# Parallelization using Cypress Cloud & merging reports

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

> :warning: This feature is especially experimental, it's subject to change anytime and is not considered under semver.

[Parallelization](https://docs.cypress.io/guides/cloud/smart-orchestration/parallelization) using Cypress Cloud is where you run `cypress run --record --parallel` on N machines in order to improve execution time. This typically generates N reports. These are obviously related to each other. They are unique sets of spec results, with no overlap, obtained through sharding (weighing and distribution by Cypress Cloud).

Different messages reports can be combined into a single messages report using the following executable. This behaves like `cat`, it reads file arguments and outputs a combined report to stdout.

```
$ npx cucumber-merge-messages *.ndjson
```

Alternatively you can redirect the output to a new file.

```
$ npx cucumber-merge-messages *.ndjson > combined-cucumber-messages.ndjson
```

Only *messages reports* can be merged. JSON and HTML reports are both products of messages and if you require either, then you can use the [JSON formatter](json-formatter.md) or [HTML formatter](html-formatter.md) to create one from the other, like shown below.

```
$ npx cucumber-merge-messages *.ndjson > combined-cucumber-messages.ndjson
$ npx cucumber-json-formatter < combined-cucumber-messages.ndjson > cucumber-report.json
$ npx cucumber-html-formatter < combined-cucumber-messages.ndjson > cucumber-report.html
```

## How do I collect reports created on N different machines?

You need to consult your CI provider's documentation. Below is a very simple example illustrating the use of *artifacts* on Gitlab CI/CD to solve this. The reason for specifying `messagesOutput` is because on Gitlab, [artifacts with the same name from different jobs overwrite each other](https://gitlab.com/gitlab-org/gitlab/-/issues/244714).

```yaml
stages:
  - test
  - report

cypress:
  stage: test
  parallel: 5
  script:
    - npx cypress run --record --parallel --env messagesOutput=cucumber-messages-$CI_NODE_INDEX.ndjson
  artifacts:
    paths:
      - *.ndjson

combine:
  stage: report
  script:
    - npx cucumber-merge-messages *.ndjson > cucumber-messages.ndjson
    - npx cucumber-json-formatter < cucumber-messages.ndjson > cucumber-report.json
    - npx cucumber-html-formatter < cucumber-messages.ndjson > cucumber-report.html
  artifacts:
    paths:
      - cucumber-messages.ndjson
      - cucumber-report.json
      - cucumber-report.html
```
