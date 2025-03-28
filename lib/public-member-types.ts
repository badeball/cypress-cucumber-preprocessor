import type * as messages from "@cucumber/messages";

export interface IParameterTypeDefinition<T, C extends Mocha.Context> {
  name: string;
  regexp: RegExp;
  transformer?: (this: C, ...match: string[]) => T;
}

export interface IRunHookOptions {
  order?: number;
}

export interface IRunHookBody {
  (this: Mocha.Context): void;
}

export interface ICaseHookOptions {
  name?: string;
  tags?: string;
  order?: number;
}

export interface ICaseHookParameter {
  pickle: messages.Pickle;
  gherkinDocument: messages.GherkinDocument;
  testCaseStartedId: string;
}

export interface ICaseHookBody {
  (this: Mocha.Context, options: ICaseHookParameter): void;
}

export interface IStepHookOptions {
  name?: string;
  tags?: string;
  order?: number;
}

export interface IStepHookParameter {
  pickle: messages.Pickle;
  pickleStep: messages.PickleStep;
  gherkinDocument: messages.GherkinDocument;
  testCaseStartedId: string;
  testStepId: string;
}

export interface IStepHookBody {
  (this: Mocha.Context, options: IStepHookParameter): void;
}

export interface IStepDefinitionBody<
  T extends unknown[],
  C extends Mocha.Context,
> {
  (this: C, ...args: T): void;
}
