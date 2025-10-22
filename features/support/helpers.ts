import assert from "node:assert";
import { version as cypressVersion } from "cypress/package.json";
import fs from "node:fs/promises";
import path from "node:path";
import ICustomWorld from "./ICustomWorld";

export async function writeFile(filePath: string, fileContent: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, fileContent);
}

export function assertAndReturn<T>(
  value: T | null | undefined,
  msg?: string,
): T {
  assert(value, msg);
  return value;
}

function isObject(object: any): object is object {
  return typeof object === "object" && object != null;
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function* traverseTree(object: any): Generator<object, void, any> {
  if (!isObject(object)) {
    throw new Error(`Expected object, got ${typeof object}`);
  }

  yield object;

  for (const property of Object.values(object)) {
    if (isObject(property)) {
      yield* traverseTree(property);
    }
  }
}

export function prepareMessagesReport(messages: any) {
  const idProperties = [
    "id",
    "hookId",
    "testStepId",
    "testCaseId",
    "testCaseStartedId",
    "pickleId",
    "pickleStepId",
    "astNodeId",
  ] as const;

  const idCollectionProperties = ["astNodeIds", "stepDefinitionIds"] as const;

  for (const message of messages) {
    for (const node of traverseTree(message)) {
      if (hasOwnProperty(node, "duration")) {
        node.duration = 0;
      }

      if (hasOwnProperty(node, "timestamp")) {
        node.timestamp = {
          seconds: 0,
          nanos: 0,
        };
      }

      if (hasOwnProperty(node, "uri") && typeof node.uri === "string") {
        node.uri = node.uri.replace(/\\/g, "/");
      }

      if (hasOwnProperty(node, "meta")) {
        node.meta = "meta";
      }

      for (const idProperty of idProperties) {
        if (hasOwnProperty(node, idProperty)) {
          node[idProperty] = "id";
        }
      }

      for (const idCollectionProperty of idCollectionProperties) {
        if (hasOwnProperty(node, idCollectionProperty)) {
          node[idCollectionProperty] = (node[idCollectionProperty] as any).map(
            () => "id",
          );
        }
      }
    }
  }

  return messages;
}

export function stringToNdJson(content: string) {
  return content
    .toString()
    .trim()
    .split("\n")
    .map((line: any) => JSON.parse(line));
}

export function ndJsonToString(ndjson: any) {
  return ndjson.map((o: any) => JSON.stringify(o)).join("\n") + "\n";
}

export function isPost12() {
  return parseInt(cypressVersion.split(".")[0], 10) >= 12;
}

export function isPre12() {
  return !isPost12();
}

/**
 * Shamelessly copied from the RegExp.escape proposal.
 */
export const rescape = (s: string) =>
  String(s).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");

export const expectLastRun = (world: ICustomWorld) =>
  assertAndReturn(world.lastRun, "Expected to find information about last run");
