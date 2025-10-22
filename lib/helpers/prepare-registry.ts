import { assignRegistry, freeRegistry, Registry } from "../registry";

const registry = new Registry();

assignRegistry(registry);

export function getAndFreeRegistry() {
  freeRegistry();
  return registry;
}
