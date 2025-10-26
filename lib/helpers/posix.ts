import path from "node:path";

export const toPosix = (location: string) =>
  path.sep === "\\" ? location.replaceAll("\\", "/") : location;
