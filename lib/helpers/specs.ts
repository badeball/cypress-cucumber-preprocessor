import * as glob from "glob";

import { toPosix } from "./paths";

/**
 * Resolves absolute paths of spec files from a resolved configuration object, mimicking what
 * `find-cypress-specs` used to do.
 */
export function getSpecs(
  config: Pick<
    Cypress.PluginConfigOptions,
    "projectRoot" | "specPattern" | "excludeSpecPattern"
  >,
): string[] {
  const ignore = [config.excludeSpecPattern].flat().map((pattern) =>
    // Patterns without slashes are matched against the basename (akin to `matchBase`).
    pattern.includes("/") ? pattern : `**/${pattern}`,
  );

  if (!ignore.some((pattern) => pattern.includes("node_modules"))) {
    ignore.push("**/node_modules/**");
  }

  return glob
    .globSync(config.specPattern, {
      cwd: config.projectRoot,
      ignore,
      absolute: true,
      nodir: true,
    })
    .map(toPosix)
    .sort();
}
