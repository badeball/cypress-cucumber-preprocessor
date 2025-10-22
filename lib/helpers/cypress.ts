import DataTable from "../data_table";
import { CypressCucumberError } from "./error";

const ensureChain = (value: unknown): Cypress.Chainable<unknown> =>
  Cypress.isCy(value) ? value : cy.wrap(value, { log: false });

const nativePromiseConstructor = (async () => {})().constructor;

function getMaxColumnWidths(tableArray: any) {
  const maxColumnWidths: any[] = [];
  for (const row of tableArray) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      const cellWidth = cell.length;
      maxColumnWidths[i] = Math.max(maxColumnWidths[i] || 0, cellWidth);
    }
  }
  return maxColumnWidths;
}

function padElements(tableArray: any[], maxColumnWidths: any[]) {
  return tableArray.map((row) =>
    row.map(
      (cell: string, index: any) =>
        (cell = cell + "&nbsp;".repeat(maxColumnWidths[index] - cell.length)),
    ),
  );
}

function convertArrayToTableString(tableArray: any[]) {
  const maxColumnWidths = getMaxColumnWidths(tableArray);
  const paddedTableArray = padElements(tableArray, maxColumnWidths);
  const lines = paddedTableArray.map((row) => row.join("&nbsp;|&nbsp;"));
  const tableString = lines.join("&nbsp;|\n|&nbsp;");
  return tableString;
}

export function runStepWithLogGroup(options: {
  fn: () => unknown;
  keyword: string;
  argument?: DataTable | string;
  text?: string;
}) {
  const log = Cypress.log({
    name: options.keyword,
    message: options.text == null ? "" : `**${options.text}**`,
    groupStart: true,
    type: "parent",
  } as object);

  if (options.argument instanceof DataTable) {
    Cypress.log({
      name: "DataTable",
      message:
        "&nbsp;\n|&nbsp;" +
        convertArrayToTableString(options.argument.raw()) +
        "&nbsp;|",
    });
  } else if (typeof options.argument === "string") {
    // TODO: Log docstring here.
  }

  const ret = options.fn();

  if (ret instanceof nativePromiseConstructor) {
    throw new CypressCucumberError(
      "Cucumber preprocessor detected that you returned a native promise from a function handler, this is not supported. Using async / await is generally speaking not supported when using Cypress, period, preprocessor or not.",
    );
  }

  return ensureChain(ret).then((result) => {
    (log as any).endGroup();
    return result;
  });
}
