import { FORCE_EXPOSE_USE } from "./force";

export function getEnv(config: Cypress.PluginConfigOptions): {
  [key: string]: any;
} {
  if (FORCE_EXPOSE_USE) {
    return (config as any).expose;
  } else {
    return (config as any).env ?? (config as any).expose;
  }
}
