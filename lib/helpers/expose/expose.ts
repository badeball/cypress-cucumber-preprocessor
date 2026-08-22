import { version as cypressVersion } from "cypress/package.json";

const FORCE_EXPOSE_USE = false;

export enum ConfigurationEra {
  Env,
  Expose,
}

export function determineConfigurationEra() {
  if (FORCE_EXPOSE_USE) {
    return ConfigurationEra.Expose;
  } else {
    const [major, minor] = cypressVersion
      .split(".")
      .map((n) => parseInt(n, 10));

    if (major >= 16) {
      return ConfigurationEra.Expose;
    } else if (major === 15 && minor >= 17) {
      return ConfigurationEra.Expose;
    } else {
      return ConfigurationEra.Env;
    }
  }
}
