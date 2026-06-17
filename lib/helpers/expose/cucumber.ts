import { version as cypressVersion } from "cypress/package.json";

import { FORCE_EXPOSE_USE } from "./force";

export function isPostExpose() {
  if (FORCE_EXPOSE_USE) {
    return true;
  } else {
    return parseInt(cypressVersion.split(".")[0], 10) >= 16;
  }
}

export function isPreExpose() {
  return !isPostExpose();
}
