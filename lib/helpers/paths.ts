import path from "node:path";

export function ensureIsAbsolute(root: string, maybeRelativePath: string) {
  if (path.isAbsolute(maybeRelativePath)) {
    return maybeRelativePath;
  } else {
    return path.join(root, maybeRelativePath);
  }
}

export function ensureIsRelative(root: string, maybeRelativePath: string) {
  if (path.isAbsolute(maybeRelativePath)) {
    return path.relative(root, maybeRelativePath);
  } else {
    return maybeRelativePath;
  }
}

export const toPosix = (location: string) =>
  path.sep === "\\" ? location.replaceAll("\\", "/") : location;
