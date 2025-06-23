import {
  CucumberExpression,
  RegularExpression,
  Expression,
  ParameterTypeRegistry,
  ParameterType,
} from "@cucumber/cucumber-expressions";

import parse from "@cucumber/tag-expressions";

import type { IdGenerator } from "@cucumber/messages";

import { assertAndReturn } from "./helpers/assertions";

import DataTable from "./data_table";

import { CypressCucumberError } from "./helpers/error";

import {
  ICaseHookBody,
  ICaseHookOptions,
  ICaseHookParameter,
  IParameterTypeDefinition,
  IRunHookBody,
  IRunHookOptions,
  IStepDefinitionBody,
  IStepHookBody,
  IStepHookParameter,
} from "./public-member-types";

import {
  maybeRetrievePositionFromSourceMap,
  Position,
} from "./helpers/source-map";

export interface IStepDefinition<T extends unknown[], C extends Mocha.Context> {
  id: string;
  expression: Expression;
  implementation: IStepDefinitionBody<T, C>;
  position?: Position;
}

export class MissingDefinitionError extends CypressCucumberError {}

export class MultipleDefinitionsError extends CypressCucumberError {}

export type RunHookKeyword = "BeforeAll" | "AfterAll";

export type CaseHookKeyword = "Before" | "After";

export type StepHookKeyword = "BeforeStep" | "AfterStep";

type Node = ReturnType<typeof parse>;

export const DEFAULT_HOOK_ORDER = 10000;

export interface IRunHook<C extends Mocha.Context> {
  implementation: IRunHookBody<C>;
  keyword: RunHookKeyword;
  order: number;
  position?: Position;
}

export interface ICaseHook<C extends Mocha.Context> {
  id: string;
  node: Node;
  implementation: ICaseHookBody<C>;
  keyword: CaseHookKeyword;
  order: number;
  position?: Position;
  tags?: string;
  name?: string;
}

export interface IStepHook<C extends Mocha.Context> {
  node: Node;
  implementation: IStepHookBody<C>;
  keyword: StepHookKeyword;
  order: number;
  position?: Position;
  tags?: string;
  name?: string;
}

const noopNode = { evaluate: () => true };

function parseMaybeTags(tags?: string): Node {
  return tags ? parse(tags) : noopNode;
}

export class Registry<C extends Mocha.Context, T extends unknown[]> {
  public parameterTypeRegistry: ParameterTypeRegistry;

  private preliminaryStepDefinitions: {
    description: string | RegExp;
    implementation: IStepDefinitionBody<T, C>;
    position?: Position;
  }[] = [];

  public stepDefinitions: IStepDefinition<T, C>[] = [];

  private preliminaryHooks: Omit<ICaseHook<C>, "id">[] = [];

  public runHooks: IRunHook<C>[] = [];

  public caseHooks: ICaseHook<C>[] = [];

  public stepHooks: IStepHook<C>[] = [];

  constructor(private experimentalSourceMap: boolean = true) {
    this.defineStep = this.defineStep.bind(this);
    this.runStepDefinition = this.runStepDefinition.bind(this);
    this.defineParameterType = this.defineParameterType.bind(this);
    this.defineBefore = this.defineBefore.bind(this);
    this.defineAfter = this.defineAfter.bind(this);

    this.parameterTypeRegistry = new ParameterTypeRegistry();
  }

  public finalize(newId: IdGenerator.NewId) {
    for (const { description, implementation, position } of this
      .preliminaryStepDefinitions) {
      if (typeof description === "string") {
        this.stepDefinitions.push({
          id: newId(),
          expression: new CucumberExpression(
            description,
            this.parameterTypeRegistry,
          ),
          implementation,
          position,
        });
      } else {
        this.stepDefinitions.push({
          id: newId(),
          expression: new RegularExpression(
            description,
            this.parameterTypeRegistry,
          ),
          implementation,
          position,
        });
      }
    }

    for (const preliminaryHook of this.preliminaryHooks) {
      this.caseHooks.push({
        id: newId(),
        ...preliminaryHook,
      });
    }
  }

  public defineStep(
    description: string | RegExp,
    implementation: IStepDefinitionBody<T, C>,
  ) {
    if (typeof description !== "string" && !(description instanceof RegExp)) {
      throw new Error("Unexpected argument for step definition");
    }

    this.preliminaryStepDefinitions.push({
      description,
      implementation,
      position: maybeRetrievePositionFromSourceMap(),
    });
  }

  public defineParameterType<T, C extends Mocha.Context>({
    name,
    regexp,
    transformer,
  }: IParameterTypeDefinition<T, C>) {
    this.parameterTypeRegistry.defineParameterType(
      new ParameterType(name, regexp, null, transformer, true, false),
    );
  }

  public defineCaseHook(
    keyword: CaseHookKeyword,
    options: ICaseHookOptions,
    fn: ICaseHookBody<C>,
  ) {
    const { order, ...remainingOptions } = options;
    this.preliminaryHooks.push({
      node: parseMaybeTags(options.tags),
      implementation: fn,
      keyword: keyword,
      position: maybeRetrievePositionFromSourceMap(),
      order: order ?? DEFAULT_HOOK_ORDER,
      ...remainingOptions,
    });
  }

  public defineBefore(options: ICaseHookOptions, fn: ICaseHookBody<C>) {
    this.defineCaseHook("Before", options, fn);
  }

  public defineAfter(options: ICaseHookOptions, fn: ICaseHookBody<C>) {
    this.defineCaseHook("After", options, fn);
  }

  public defineStepHook(
    keyword: StepHookKeyword,
    options: ICaseHookOptions,
    fn: IStepHookBody<C>,
  ) {
    const { order, ...remainingOptions } = options;
    this.stepHooks.push({
      node: parseMaybeTags(options.tags),
      implementation: fn,
      keyword: keyword,
      position: maybeRetrievePositionFromSourceMap(),
      order: order ?? DEFAULT_HOOK_ORDER,
      ...remainingOptions,
    });
  }

  public defineBeforeStep(options: ICaseHookOptions, fn: IStepHookBody<C>) {
    this.defineStepHook("BeforeStep", options, fn);
  }

  public defineAfterStep(options: ICaseHookOptions, fn: IStepHookBody<C>) {
    this.defineStepHook("AfterStep", options, fn);
  }

  public defineRunHook(
    keyword: RunHookKeyword,
    options: IRunHookOptions,
    fn: IRunHookBody<C>,
  ) {
    this.runHooks.push({
      implementation: fn,
      keyword: keyword,
      position: maybeRetrievePositionFromSourceMap(),
      order: options.order ?? DEFAULT_HOOK_ORDER,
    });
  }

  public defineBeforeAll(options: IRunHookOptions, fn: IRunHookBody<C>) {
    this.defineRunHook("BeforeAll", options, fn);
  }

  public defineAfterAll(options: IRunHookOptions, fn: IRunHookBody<C>) {
    this.defineRunHook("AfterAll", options, fn);
  }

  public getMatchingStepDefinitions(text: string) {
    return this.stepDefinitions.filter((stepDefinition) =>
      stepDefinition.expression.match(text),
    );
  }

  public resolveStepDefinition(text: string) {
    const matchingStepDefinitions = this.getMatchingStepDefinitions(text);

    if (matchingStepDefinitions.length === 0) {
      throw new MissingDefinitionError(
        `Step implementation missing for: ${text}`,
      );
    } else if (matchingStepDefinitions.length > 1) {
      throw new MultipleDefinitionsError(
        `Multiple matching step definitions for: ${text}\n` +
          matchingStepDefinitions
            .map((stepDefinition) => {
              const { expression } = stepDefinition;

              const stringExpression =
                expression instanceof RegularExpression
                  ? String(expression.regexp)
                  : expression.source;

              if (stepDefinition.position) {
                return ` ${stringExpression} - ${stepDefinition.position.source}:${stepDefinition.position.line}`;
              } else {
                return ` ${stringExpression}`;
              }
            })
            .join("\n"),
      );
    } else {
      return matchingStepDefinitions[0];
    }
  }

  public runStepDefinition(
    world: C,
    text: string,
    dryRun: boolean,
    argument?: DataTable | string,
  ): unknown {
    const stepDefinition = this.resolveStepDefinition(text);

    const args = stepDefinition.expression
      .match(text)!
      .map((match) => match.getValue(world)) as T;

    if (argument) {
      args.push(argument);
    }

    if (dryRun) {
      return;
    }

    return stepDefinition.implementation.apply(world, args);
  }

  public resolveCaseHooks(keyword: CaseHookKeyword, tags: string[]) {
    return this.caseHooks
      .filter((hook) => hook.keyword === keyword && hook.node.evaluate(tags))
      .sort((a, b) => {
        return a.order - b.order;
      });
  }

  public resolveBeforeHooks(tags: string[]) {
    return this.resolveCaseHooks("Before", tags);
  }

  public resolveAfterHooks(tags: string[]) {
    return this.resolveCaseHooks("After", tags).reverse();
  }

  public runCaseHook(
    world: C,
    hook: ICaseHook<C>,
    options: ICaseHookParameter,
  ) {
    return hook.implementation.call(world, options);
  }

  public resolveStepHooks(keyword: StepHookKeyword, tags: string[]) {
    return this.stepHooks
      .filter((hook) => hook.keyword === keyword && hook.node.evaluate(tags))
      .sort((a, b) => {
        return a.order - b.order;
      });
  }

  public resolveBeforeStepHooks(tags: string[]) {
    return this.resolveStepHooks("BeforeStep", tags);
  }

  public resolveAfterStepHooks(tags: string[]) {
    return this.resolveStepHooks("AfterStep", tags).reverse();
  }

  public runStepHook(
    world: C,
    hook: IStepHook<C>,
    options: IStepHookParameter,
  ) {
    return hook.implementation.call(world, options);
  }

  public resolveRunHooks(keyword: RunHookKeyword) {
    return this.runHooks
      .filter((hook) => hook.keyword === keyword)
      .sort((a, b) => {
        return a.order - b.order;
      });
  }

  public resolveBeforeAllHooks() {
    return this.resolveRunHooks("BeforeAll");
  }

  public resolveAfterAllHooks() {
    return this.resolveRunHooks("AfterAll").reverse();
  }

  public runRunHook(world: C, hook: IRunHook<C>) {
    return hook.implementation.call(world);
  }
}

const globalPropertyName =
  "__cypress_cucumber_preprocessor_registry_dont_use_this";

export function withRegistry<C extends Mocha.Context, T extends unknown[]>(
  experimentalSourceMap: boolean,
  fn: () => void,
): Registry<C, T> {
  const registry = new Registry<C, T>(experimentalSourceMap);
  assignRegistry(registry);
  fn();
  freeRegistry();
  return registry;
}

export function assignRegistry<C extends Mocha.Context, T extends unknown[]>(
  registry: Registry<C, T>,
) {
  globalThis[globalPropertyName] = registry;
}

export function freeRegistry() {
  delete globalThis[globalPropertyName];
}

export function getRegistry<
  C extends Mocha.Context,
  T extends unknown[],
>(): Registry<C, T> {
  return assertAndReturn(
    globalThis[globalPropertyName],
    "Expected to find a global registry (this usually means you are trying to define steps or hooks in support/e2e.js, which is not supported)",
  );
}
