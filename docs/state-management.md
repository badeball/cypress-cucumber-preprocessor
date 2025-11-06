[← Back to documentation](readme.md)

# State management

> :warning: You are currently viewing documentation for the v23.x.y branch of the library and it does not contain most recent changes. For the latest documentation, switch to viewing the master branch.

A step definition can transfer state to a subsequent step definition by storing state in instance variables, as shown below.

```ts
import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("a step asynchronously assigning to World", function() {
  cy.then(() => {
    this.foo = "bar";
  });
});

Given("a step accessing said assignment synchronously", function() {
  expect(this.foo).to.equal("bar");
});
```

Please note that if you use arrow functions, you won’t be able to share state between steps!

## Replicating `setWorldConstructor`

Even though `setWorldConstructor` isn't implemented, it's behavior can be closely replicated like shown below.

```gherkin
# cypress/e2e/math.feature
Feature: Replicating setWorldConstructor()
  Scenario: easy maths
    Given a variable set to 1
    When I increment the variable by 1
    Then the variable should contain 2
```

```ts
// cypress/support/e2e.ts
beforeEach(function () {
  const world = {
    variable: 0,

    setTo(number) {
      this.variable = number;
    },

    incrementBy(number) {
      this.variable += number;
    }
  };

  Object.assign(this, world);
});
```

```ts
// cypress/support/step_definitions/steps.js
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("a variable set to {int}", function(number) {
  this.setTo(number);
});

When("I increment the variable by {int}", function(number) {
  this.incrementBy(number);
});

Then("the variable should contain {int}", function(number) {
  expect(this.variable).to.equal(number);
});
```

## TypeScript

If you're using TypeScript, you can get optimum type safety and completion based on your custom world, by setting the type of `this` in your step functions:

```ts
interface CustomWorld extends Mocha.Context {
  eat(count: number): void;
}

When("I eat {int} cucumbers", function (this: CustomWorld, count: number) {
  this.eat(count);
});
```

Alternatively, you can extend the default type `Mocha.Context` using a declaration file like shown below.

```ts
// declarations.d.ts
interface CustomWorld {
  eat(count: number): void;
}

declare namespace Mocha {
  interface Context extends CustomWorld {}
}

// steps.ts
When("I eat {int} cucumbers", function (count: number) {
  this.eat(count);
});
```
