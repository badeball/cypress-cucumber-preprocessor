import { toByteArray } from "base64-js";

import ErrorStackParser from "error-stack-parser";

import { SourceMapConsumer } from "source-map";

export interface Position {
  line: number;
  column: number;
  source: string;
}

let isSourceMapWarned = false;

function sourceMapWarn(message: string) {
  if (isSourceMapWarned) {
    return;
  }

  console.warn("cypress-cucumber-preprocessor: " + message);
  isSourceMapWarned = true;
}

const cache = new Map<string, SourceMapConsumer | undefined>();

/**
 * Taken from https://github.com/evanw/node-source-map-support/blob/v0.5.21/source-map-support.js#L148-L177.
 */
export function retrieveSourceMapURL(source: string) {
  let fileData: string;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", source, /** async */ false);
  xhr.send(null);

  const { readyState, status } = xhr;

  if (readyState === 4 && status === 200) {
    fileData = xhr.responseText;
  } else {
    sourceMapWarn(
      `Unable to retrieve source map (readyState = ${readyState}, status = ${status})`,
    );
    return;
  }

  const re =
    /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/gm;

  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  let lastMatch, match;

  while ((match = re.exec(fileData))) lastMatch = match;

  if (!lastMatch) {
    sourceMapWarn(
      "Unable to find source mapping URL within the response. Are you bundling with source maps enabled?",
    );
    return;
  }

  return lastMatch[1];
}

export function createSourceMapConsumer(
  source: string,
): SourceMapConsumer | undefined {
  const sourceMappingURL = retrieveSourceMapURL(source);

  if (!sourceMappingURL) {
    return;
  }

  const rawSourceMap = JSON.parse(
    new TextDecoder().decode(
      toByteArray(sourceMappingURL.slice(sourceMappingURL.indexOf(",") + 1)),
    ),
  );

  // Why? Because of Vite. Vite fails building the source-map module properly and this errors with "x is not a constructor".
  if (typeof SourceMapConsumer !== "function") {
    return;
  }

  return new SourceMapConsumer(rawSourceMap);
}

export function cachedCreateSourceMapConsumer(
  source: string,
): SourceMapConsumer | undefined {
  if (cache.has(source)) {
    return cache.get(source);
  } else {
    const result = createSourceMapConsumer(source);
    cache.set(source, result);
    return result;
  }
}

export function maybeRetrievePositionFromSourceMap(): Position | undefined {
  const stack = ErrorStackParser.parse(new Error());

  const relevantFrame = stack[3];

  if (relevantFrame.fileName == null) {
    return;
  }

  const sourceMap = cachedCreateSourceMapConsumer(relevantFrame.fileName);

  if (!sourceMap) {
    return;
  }

  const position = sourceMap.originalPositionFor({
    line: relevantFrame.getLineNumber()!,
    column: relevantFrame.getColumnNumber()!,
  });

  position.source = position.source.replace(/^webpack:\/\/\//, "");

  return position;
}
