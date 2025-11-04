declare module "find-cypress-specs" {
  export function getSpecs(
    config: Cypress.ConfigOptions,
    type: Cypress.TestingType,
    returnAbsolute?: boolean,
  ): string[];

  export function getSpecs(
    config: Cypress.PluginConfigOptions,
    type: Cypress.TestingType,
    returnAbsolute?: boolean,
  ): string[];

  export function getConfig(): Cypress.ConfigOptions;
}
