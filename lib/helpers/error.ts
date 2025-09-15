export const homepage =
  "https://github.com/badeball/cypress-cucumber-preprocessor";

export class CypressCucumberError extends Error {}

// Inspired from https://stackoverflow.com/a/52183279.
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface ClassType<T, A extends any[]> extends Function {
  new (...args: A): T;
}

export function createError(
  message: string,
  errorType: ClassType<Error, [string]> = CypressCucumberError,
) {
  return new errorType(
    `${message} (this might be a bug, please report at ${homepage})`,
  );
}
