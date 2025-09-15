export const homepage =
  "https://github.com/badeball/cypress-cucumber-preprocessor";

export class CypressCucumberError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
interface Type<T> extends Function {
  new (...args: any[]): T;
}

export function createError(
  message: string,
  errorType: Type<Error> = CypressCucumberError,
) {
  return new errorType(
    `${message} (this might be a bug, please report at ${homepage})`,
  );
}
