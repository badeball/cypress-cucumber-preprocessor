import { FORCE_EXPOSE_USE } from "./force";

export function getInternalValue(key: string): any {
  const cypress = Cypress as any;

  if (FORCE_EXPOSE_USE) {
    return cypress.expose(key);
  } else {
    return (cypress.env ?? cypress.expose)(key);
  }
}

export function isPostExpose() {
  if (FORCE_EXPOSE_USE) {
    return true;
  } else {
    const cypress = Cypress as any;

    return cypress.env ? false : true;
  }
}
