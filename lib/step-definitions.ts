import assert from "node:assert/strict";
import path from "node:path";
import util from "node:util";

import * as glob from "glob";

import debug from "./helpers/debug";
import { IPreprocessorConfiguration } from "./preprocessor-configuration";

export async function getStepDefinitionPaths(
  projectRoot: string,
  stepDefinitionPatterns: string[],
): Promise<string[]> {
  return (
    await Promise.all(
      stepDefinitionPatterns.map((pattern) =>
        glob.glob(pattern, {
          cwd: projectRoot,
          absolute: true,
          nodir: true,
          windowsPathsNoEscape: true,
        }),
      ),
    )
  ).reduce((acum, el) => acum.concat(el), []);
}

function trimFeatureExtension(filepath: string) {
  return filepath.replace(/\.feature$/, "");
}

export function pathParts(relativePath: string): string[] {
  assert(
    !path.isAbsolute(relativePath),
    `Expected a relative path but got ${relativePath}`,
  );

  const parts: string[] = [];

  do {
    parts.push(relativePath);
  } while (
    (relativePath = path.normalize(path.join(relativePath, ".."))) !== "."
  );

  return parts;
}

export function getStepDefinitionPatterns(
  configuration: Pick<
    IPreprocessorConfiguration,
    "stepDefinitions" | "implicitIntegrationFolder"
  >,
  filepath: string,
): string[] {
  /**
   * The reason for these assertions is that when giving relative paths to path.relative, the result
   * will depend on CWD, which is affected by EG. the --config-file parameter [1].
   *
   * [1] https://github.com/badeball/cypress-cucumber-preprocessor/issues/1243
   */
  assert(
    path.isAbsolute(configuration.implicitIntegrationFolder),
    `Expected an absolute path for implicit integration folder but got ${configuration.implicitIntegrationFolder}`,
  );

  assert(
    path.isAbsolute(filepath),
    `Expected an absolute path for spec but got ${filepath}`,
  );

  const filepathReplacement = glob.escape(
    trimFeatureExtension(
      path.relative(configuration.implicitIntegrationFolder, filepath),
    ),
    { windowsPathsNoEscape: true },
  );

  debug(`replacing [filepath] with ${util.inspect(filepathReplacement)}`);

  const parts = pathParts(filepathReplacement);

  debug(`replacing [filepart] with ${util.inspect(parts)}`);

  const stepDefinitions = [configuration.stepDefinitions].flat();

  return stepDefinitions.flatMap((pattern) => {
    if (pattern.includes("[filepath]") && pattern.includes("[filepart]")) {
      throw new Error(
        `Pattern cannot contain both [filepath] and [filepart], but got ${util.inspect(
          pattern,
        )}`,
      );
    } else if (pattern.includes("[filepath]")) {
      return pattern.replace("[filepath]", filepathReplacement);
    } else if (pattern.includes("[filepart]")) {
      return [
        ...parts.map((part) => pattern.replace("[filepart]", part)),
        path.normalize(pattern.replace("[filepart]", ".")),
      ];
    } else {
      return pattern;
    }
  });
}
