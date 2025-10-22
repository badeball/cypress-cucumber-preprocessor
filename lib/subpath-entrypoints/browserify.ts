import { PassThrough, Transform, TransformCallback } from "node:stream";

import debug from "../helpers/debug";
import { compile } from "../template";

export default function transform(
  configuration: Cypress.PluginConfigOptions,
  filepath: string,
) {
  if (!filepath.match(".feature$")) {
    return new PassThrough();
  }

  debug(`compiling ${filepath}`);

  let buffer = Buffer.alloc(0);

  return new Transform({
    transform(chunk, encoding, done) {
      buffer = Buffer.concat([buffer, chunk]);
      done();
    },
    async flush(done: TransformCallback) {
      try {
        done(
          null,
          await compile(configuration, buffer.toString("utf8"), filepath),
        );

        debug(`compiled ${filepath}`);
      } catch (e: any) {
        done(e);
      }
    },
  });
}

export { transform };

export function preprendTransformerToOptions(
  configuration: Cypress.PluginConfigOptions,
  options: any,
) {
  let wrappedTransform;

  if (
    !options.browserifyOptions ||
    !Array.isArray(options.browserifyOptions.transform)
  ) {
    wrappedTransform = [transform.bind(null, configuration)];
  } else {
    wrappedTransform = [
      transform.bind(null, configuration),
      ...options.browserifyOptions.transform,
    ];
  }

  return {
    ...options,
    browserifyOptions: {
      ...(options.browserifyOptions || {}),
      transform: wrappedTransform,
    },
  };
}
