import { ConfigurationEra, determineConfigurationEra } from "./expose";

export function isPostExpose() {
  return determineConfigurationEra() === ConfigurationEra.Expose;
}
