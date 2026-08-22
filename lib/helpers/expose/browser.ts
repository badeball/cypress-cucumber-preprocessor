import { ConfigurationEra, determineConfigurationEra } from "./expose";

export function getInternalValue(key: string): any {
  const cypress = Cypress as any;

  if (determineConfigurationEra() === ConfigurationEra.Expose) {
    return cypress.expose(key);
  } else {
    return cypress.env(key);
  }
}
