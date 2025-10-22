import { TagParserError } from "./errors";
import {
  isAt,
  isClosingParenthesis,
  isComma,
  isDigit,
  isEqual,
  isOpeningParenthesis,
  isQuote,
  isWordChar,
  Tokenizer,
} from "./tokenizer";

function createUnexpectedEndOfString() {
  return new TagParserError("Unexpected end-of-string");
}

function createUnexpectedToken(
  token: TYield<TokenGenerator>,
  expectation: string,
) {
  return new Error(
    `Unexpected token at ${token.position}: ${token.value} (${expectation})`,
  );
}

function expectToken(token: Token) {
  if (token.done) {
    throw createUnexpectedEndOfString();
  }

  return token;
}

function parsePrimitiveToken(token: Token) {
  if (token.done) {
    throw createUnexpectedEndOfString();
  }

  const value = token.value.value;

  const char = value[0];

  if (value === "false") {
    return false;
  } else if (value === "true") {
    return true;
  }
  if (isDigit(char)) {
    return parseInt(value);
  } else if (isQuote(char)) {
    return value.slice(1, -1);
  } else {
    throw createUnexpectedToken(
      token.value,
      "expected a string, a boolean or a number",
    );
  }
}

type TYield<T> = T extends Generator<infer R, any, any> ? R : never;

type TReturn<T> = T extends Generator<any, infer R, any> ? R : never;

interface IteratorYieldResult<TYield> {
  done?: false;
  value: TYield;
}

interface IteratorReturnResult<TReturn> {
  done: true;
  value: TReturn;
}

type IteratorResult<T> =
  | IteratorYieldResult<TYield<T>>
  | IteratorReturnResult<TReturn<T>>;

type TokenGenerator = ReturnType<(typeof Tokenizer.prototype)["tokens"]>;

type Token = IteratorResult<TokenGenerator>;

class BufferedGenerator<T, TReturn, TNext> {
  private tokens: (IteratorYieldResult<T> | IteratorReturnResult<TReturn>)[] =
    [];

  private position = -1;

  constructor(generator: Generator<T, TReturn, TNext>) {
    do {
      this.tokens.push(generator.next());
    } while (!this.tokens[this.tokens.length - 1].done);
  }

  next() {
    if (this.position < this.tokens.length - 1) {
      this.position++;
    }

    return this.tokens[this.position];
  }

  peak(n = 1) {
    return this.tokens[this.position + n];
  }
}

type Primitive = string | boolean | number;

export default class Parser {
  public constructor(private content: string) {}

  parse(): [string, Primitive | Primitive[] | Record<string, Primitive>] {
    const tokens = new BufferedGenerator(new Tokenizer(this.content).tokens());

    let next: Token = expectToken(tokens.next());

    if (!isAt(next.value.value)) {
      throw createUnexpectedToken(next.value, "expected tag to begin with '@'");
    }

    next = expectToken(tokens.next());

    if (!isWordChar(next.value.value[0])) {
      throw createUnexpectedToken(
        next.value,
        "expected tag to start with a property name",
      );
    }

    const propertyName = next.value.value;

    next = expectToken(tokens.next());

    if (!isOpeningParenthesis(next.value.value)) {
      throw createUnexpectedToken(next.value, "expected opening parenthesis");
    }

    const isObjectMode = isEqual(expectToken(tokens.peak(2)).value.value);
    const entries: [string, Primitive][] = [];
    const values: Primitive[] = [];

    if (isObjectMode) {
      while (true) {
        const key = expectToken(tokens.next()).value.value;

        next = expectToken(tokens.next());

        if (!isEqual(next.value.value)) {
          throw createUnexpectedToken(next.value, "expected equal sign");
        }

        const value = parsePrimitiveToken(tokens.next());

        entries.push([key, value]);

        if (!isComma(expectToken(tokens.peak()).value.value)) {
          break;
        } else {
          tokens.next();
        }
      }
    } else {
      while (true) {
        const value = parsePrimitiveToken(tokens.next());

        values.push(value);

        if (!isComma(expectToken(tokens.peak()).value.value)) {
          break;
        } else {
          tokens.next();
        }
      }
    }

    next = expectToken(tokens.next());

    if (next.done) {
      throw createUnexpectedEndOfString();
    } else if (!isClosingParenthesis(next.value.value)) {
      throw createUnexpectedToken(next.value, "expected closing parenthesis");
    }

    if (isObjectMode) {
      return [propertyName, Object.fromEntries(entries)];
    } else {
      return [propertyName, values.length === 1 ? values[0] : values];
    }
  }
}
