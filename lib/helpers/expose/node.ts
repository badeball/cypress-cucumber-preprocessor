import { ConfigurationEra, determineConfigurationEra } from "./expose";

export function getEnv(config: Cypress.PluginConfigOptions): {
  [key: string]: any;
} {
  if (determineConfigurationEra() === ConfigurationEra.Expose) {
    return (config as any).expose;
  } else {
    return (config as any).env;
  }
}
