import {
  buildQueries,
  Matcher,
  MatcherOptions,
  queryHelpers,
} from "@testing-library/dom";

const queryAllByAccordionComponent = (
  container: HTMLElement,
  id: Matcher,
  options?: MatcherOptions | undefined,
) =>
  queryHelpers.queryAllByAttribute(
    "data-accordion-component",
    container,
    id,
    options,
  );

const getMultipleError = (c: any, dataAccordionComponent: string) =>
  `Found multiple elements with the data-accordion-component attribute of: ${dataAccordionComponent}`;
const getMissingError = (c: any, dataAccordionComponent: string) =>
  `Unable to find an element with the data-accordion-component attribute of: ${dataAccordionComponent}`;

const [
  queryByAccordionComponent,
  getAllByAccordionComponent,
  getByAccordionComponent,
  findAllByAccordionComponent,
  findByAccordionComponent,
] = buildQueries(
  queryAllByAccordionComponent,
  getMultipleError,
  getMissingError,
);

export {
  findAllByAccordionComponent,
  findByAccordionComponent,
  getAllByAccordionComponent,
  getByAccordionComponent,
  queryAllByAccordionComponent,
  queryByAccordionComponent,
};
