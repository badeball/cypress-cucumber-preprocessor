import type * as messages from "@cucumber/messages";

import { assert, ensure } from "./helpers/assertions";

function zip<A, B>(collectionA: A[], collectionB: B[]) {
  return collectionA.map<[A, B]>((element, index) => [
    element,
    collectionB[index],
  ]);
}

export default class DataTable {
  private readonly rawTable: string[][];

  constructor(sourceTable: messages.PickleTable | string[][]) {
    if (sourceTable instanceof Array) {
      this.rawTable = sourceTable;
    } else {
      this.rawTable = ensure(
        sourceTable.rows,
        "Expected a PicleTable to have rows",
      ).map((row) =>
        ensure(row.cells, "Expected a PicleTableRow to have cells").map(
          (cell) => {
            const { value } = cell;
            assert(value != null, "Expected a PicleTableCell to have a value");
            return value;
          },
        ),
      );
    }
  }

  hashes(): Record<string, string>[] {
    const copy = this.raw();
    const keys = copy[0];
    const valuesArray = copy.slice(1);
    return valuesArray.map((values) => Object.fromEntries(zip(keys, values)));
  }

  raw(): string[][] {
    return this.rawTable.slice(0);
  }

  rows(): string[][] {
    const copy = this.raw();
    copy.shift();
    return copy;
  }

  rowsHash(): Record<string, string> {
    return Object.fromEntries(
      this.raw().map<[string, string]>((values) => {
        const [first, second, ...rest] = values;

        if (first == null || second == null || rest.length !== 0) {
          throw new Error(
            "rowsHash can only be called on a data table where all rows have exactly two columns",
          );
        }

        return [first, second];
      }),
    );
  }

  transpose(): DataTable {
    const transposed = this.rawTable[0].map((x, i) =>
      this.rawTable.map((y) => y[i]),
    );

    return new DataTable(transposed);
  }

  toString() {
    return "[object DataTable]";
  }
}
