export function getInternalValue(key: string): any {
  const cypress = Cypress as any;

  return (cypress.env ?? cypress.expose)(key);
}
