import { createError, CypressCucumberError } from "./error";

import { isString } from "./type-guards";

export class CypressCucumberAssertionError extends CypressCucumberError {}

export function assertNever(value: never): never {
  throw new Error("Illegal value: " + value);
}

export function fail(message: string) {
  throw createError(message, CypressCucumberAssertionError);
}

export function assert(value: unknown, message: string): asserts value {
  if (value != null) {
    return;
  }

  fail(message);
}

export function ensure<T>(
  value: T,
  message: string,
): Exclude<T, false | null | undefined> {
  assert(value, message);
  return value as Exclude<T, false | null | undefined>;
}

export function assertIsString(
  value: unknown,
  message: string,
): asserts value is string {
  assert(isString(value), message);
}
