import fs from "node:fs/promises";

import path from "node:path";

import type esbuild from "esbuild";

import { compile } from "../template";

import { ensure } from "../helpers/assertions";

import { default as origDebug } from "../helpers/debug";

const debug = origDebug.extend("esbuild");

const toPosix = (location: string) =>
  path.sep === "\\" ? location.replaceAll("\\", "/") : location;

export function createEsbuildPlugin(
  configuration: Cypress.PluginConfigOptions,
  options: { prettySourceMap: boolean } = { prettySourceMap: false },
): esbuild.Plugin {
  return {
    name: "feature",
    setup(build) {
      if (options.prettySourceMap) {
        build.initialOptions.sourcemap = "external";

        build.onEnd(async () => {
          const outfile = ensure(
            build.initialOptions.outfile,
            "Expected an outfile",
          );

          const sourceMapLocation = outfile + ".map";

          const sourceMap = JSON.parse(
            (await fs.readFile(sourceMapLocation)).toString(),
          );

          const lastSource: string | undefined =
            sourceMap.sources[sourceMap.sources.length - 1];

          // The sources property contains posix paths, even on windows.
          const startsWith = toPosix(
            path.relative(path.dirname(outfile), configuration.projectRoot),
          );

          const needPrettify = lastSource?.startsWith(startsWith) ?? false;

          debug("startsWith", startsWith);
          debug("last source", lastSource);
          debug("project root", configuration.projectRoot);
          debug("outfile", outfile);
          debug("sources before", sourceMap.sources.slice(-5));

          /**
           * There are numerous issues regarding the sources property in esbuild, particularly when
           * different drives are involved (which is the case on Github actions, when using
           * Windows).
           *
           * - https://github.com/evanw/esbuild/issues/3460
           * - https://github.com/evanw/esbuild/issues/3183
           * - https://github.com/evanw/esbuild/issues/2595
           * - https://github.com/evanw/esbuild/issues/2218
           * - https://github.com/evanw/esbuild/issues/1699
           * - https://github.com/evanw/esbuild/pull/1234
           *
           * I originally thought that my issue (#2218) was the only thing standing in the way, but
           * it turns out there's more. The stack traces simply aren't going to be good when
           * bundling using esbuild. However, that doesn't matter for the purpose of the usage
           * reporter - only the last sources, IE. the one pointing to the users project need
           * to be correct.
           */
          if (needPrettify) {
            debug("esbuild: prettifying sources");

            sourceMap.sources = sourceMap.sources.map((source: string) => {
              return path.relative(
                configuration.projectRoot,
                path.normalize(path.join(path.dirname(outfile), source)),
              );
            });
          } else {
            debug("esbuild: using original sources");
          }

          debug("sources after", sourceMap.sources.slice(-5));

          await fs.rm(sourceMapLocation);

          const encoded = Buffer.from(JSON.stringify(sourceMap)).toString(
            "base64",
          );

          /**
           * Why `${"sourceMappingURL"}` you may ask. This is so esbuild doesn't crap itself upon
           * errors, where it would search for source maps and find THIS code line, which is not a
           * valid source map (obviously).
           *
           * Without this, esbuild would error with "Unexpected token z in JSON at position 0" every
           * time an error occurred during build time.
           */
          await fs.appendFile(
            outfile,
            `//# ${"sourceMappingURL"}=data:application/json;base64,${encoded}\n`,
          );
        });
      }

      build.onLoad({ filter: /\.feature$/ }, async (args) => {
        const content = await fs.readFile(args.path, "utf8");

        return {
          contents: await compile(configuration, content, args.path),
          loader: "js",
        };
      });
    },
  };
}

export default createEsbuildPlugin;
