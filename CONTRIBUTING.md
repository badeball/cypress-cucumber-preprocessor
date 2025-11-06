# Contributing to this project

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

Please take a moment to review this document in order to make the contribution
process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project. In return,
they should reciprocate that respect in addressing your issue or assessing
patches and features.

## Using the issue tracker

The issue tracker is the preferred channel for [bug reports](#bug-reports),
[features requests](#feature-requests) and [submitting pull
requests](#pull-requests), but please respect the following restrictions:

* Please **do not** use the issue tracker for personal support requests (use
  [Stack Overflow][so] or [Cypress Community][discord] on Discord[^1]).

* Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others.

## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Read the [FAQ][faq]** &mdash; even if you think you have found a bug.

2. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

3. **:bangbang:Isolate the problem:bangbang:** &mdash; create a [reduced test
   case](#reduced-test-case).

4. **Don't exclusively post screenshots** &mdash; screenshots are only allowed
   when accompanied by text, to ensure all issues are searchable.

5. **Format blocks of code** &mdash; use [markdown][format-code] to properly
   format blocks of code for maximum readability.

6. **Attach debug information** &mdash; enable debug output by running Cypress
   with the following environment variable.

   ```
   $ DEBUG=cypress:electron,cypress-configuration,cypress-cucumber-preprocessor cypress run
   ```

A good bug report shouldn't leave others needing to chase you up for more
information. Please try to be as detailed as possible in your report. What is
your environment? What steps will reproduce the issue? What browser(s) and OS
experience the problem? What would you expect to be the outcome? All these
details will help people to fix any potential bugs.

## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.

## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

Please adhere to the coding conventions used throughout a project (indentation,
accurate comments, etc.) and any other requirements (such as test coverage).

Follow this process if you'd like your work considered for inclusion in the
project:

1. [Fork][forking] the project, clone your fork, and configure the remotes:

   ```bash
   # Clone your fork of the repo into the current directory
   git clone https://github.com/<your-username>/<repo-name>
   # Navigate to the newly cloned directory
   cd <repo-name>
   # Assign the original repo to a remote called "upstream"
   git remote add upstream https://github.com/badeball/cypress-cucumber-preprocessor
   ```

2. If you cloned a while ago, get the latest changes from upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch (off the main project development branch) to
   contain your feature, change, or fix:

   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Commit your changes in logical chunks. Please adhere to these [git commit
   message guidelines][commit-messages] or your code is unlikely be merged
   into the main project. Use Git's [interactive rebase][interactive-rebase]
   feature to tidy up your commits before making them public.

5. Locally merge (or rebase) the upstream master branch into your topic branch:

   ```bash
   git pull [--rebase] upstream master
   ```

6. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

7. [Open a Pull Request][using-pull-requests] with a clear title and
   description.

**IMPORTANT**: By submitting a patch, you agree to allow the project owner to
license your work under the same license as that used by the project.

## Reduced test case

> Reduced test cases are the absolute, no doubt about it, number one way to
troubleshoot bugs.

This is also commonly referred to as a «minimal, reproducible example». The
concept is explained by Chris Coyier in [Reduced Test
Cases][reduced-test-cases]. SO also has an excellent article on the subject,
[How to create a Minimal, Reproducible Example][minimal-reproducible-example].
You may skip these and just read the following.

*Some way* of reproducing an issue is a prerequisite to fixing it. No one can
fix issues blindly, that much should be obvious.

A reduced test case / minimal, reproducible example is something so minimal
that it barely illustrates the issue at hand and nothing more. A minimal,
reproducible example should ideally be the foundation for a test.  It's
something that should be committed into the codebase to ensure that it never
resurfaces again.

Almost everyone that creates a bug report here will be asked to provide this.

But don't panic, no one's after your company secrets. In fact, no one wants to
look at your production code at all. A minimal, reproducible example should be
completely void of anything resembling company secrets.

Any of the many [examples][examples] can serve as a good starting point for
creating a minimal, reproducible example. Take one, modify it and use it to
illustrate what you think is wrong. Upload it to EG. Github and link to it from
your bug report.

Another and perhaps more important reason for why you're asked to go through
the exercise of reducing the problem, is to ensure that the real problem is
actually what you describe it to be. You might be surprised how often I find
this not to be the case.

[so]: https://stackoverflow.com/
[discord]: https://on.cypress.io/chat
[faq]: docs/faq.md
[format-code]: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks
[forking]: https://docs.github.com/en/get-started/quickstart/fork-a-repo
[commit-messages]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
[interactive-rebase]: https://docs.github.com/en/get-started/using-git/about-git-rebase
[using-pull-requests]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
[reduced-test-cases]: https://css-tricks.com/reduced-test-cases/
[minimal-reproducible-example]: https://stackoverflow.com/help/minimal-reproducible-example
[examples]: examples

[^1]: The Discord server doesn't specifically pertain to community-maintained
plugins, so your mileage may vary.
