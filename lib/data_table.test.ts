import assert from "assert/strict";

import * as messages from "@cucumber/messages";

import DataTable from "./data_table";

describe("DataTable", () => {
  describe("table with headers", () => {
    const dataTable: messages.PickleTable = {
      rows: [
        {
          cells: [{ value: "header 1" }, { value: "header 2" }],
        },
        {
          cells: [{ value: "row 1 col 1" }, { value: "row 1 col 2" }],
        },
        {
          cells: [{ value: "row 2 col 1" }, { value: "row 2 col 2" }],
        },
      ],
    };

    describe("rows", () => {
      it("returns a 2-D array without the header", () => {
        assert.deepEqual(new DataTable(dataTable).rows(), [
          ["row 1 col 1", "row 1 col 2"],
          ["row 2 col 1", "row 2 col 2"],
        ]);
      });
    });

    describe("hashes", () => {
      it("returns an array of object where the keys are the headers", () => {
        assert.deepEqual(new DataTable(dataTable).hashes(), [
          { "header 1": "row 1 col 1", "header 2": "row 1 col 2" },
          { "header 1": "row 2 col 1", "header 2": "row 2 col 2" },
        ]);
      });
    });

    describe("transpose", () => {
      it("returns a new DataTable, with the data transposed", () => {
        assert.deepEqual(new DataTable(dataTable).transpose().raw(), [
          ["header 1", "row 1 col 1", "row 2 col 1"],
          ["header 2", "row 1 col 2", "row 2 col 2"],
        ]);
      });
    });
  });

  describe("table without headers", () => {
    const dataTable: messages.PickleTable = {
      rows: [
        {
          cells: [{ value: "row 1 col 1" }, { value: "row 1 col 2" }],
        },
        {
          cells: [{ value: "row 2 col 1" }, { value: "row 2 col 2" }],
        },
      ],
    };

    describe("raw", () => {
      it("returns a 2-D array", () => {
        assert.deepEqual(new DataTable(dataTable).raw(), [
          ["row 1 col 1", "row 1 col 2"],
          ["row 2 col 1", "row 2 col 2"],
        ]);
      });
    });

    describe("rowsHash", () => {
      it("returns an object where the keys are the first column", () => {
        assert.deepEqual(new DataTable(dataTable).rowsHash(), {
          "row 1 col 1": "row 1 col 2",
          "row 2 col 1": "row 2 col 2",
        });
      });
    });
  });

  describe("table with something other than 2 columns", () => {
    const dataTable: messages.PickleTable = {
      rows: [
        {
          cells: [{ value: "row 1 col 1" }],
        },
        {
          cells: [{ value: "row 2 col 1" }],
        },
      ],
    };

    describe("rowsHash", () => {
      it("throws an error if not all rows have two columns", function () {
        assert.throws(() => {
          new DataTable(dataTable).rowsHash();
        }, new Error("rowsHash can only be called on a data table where all rows have exactly two columns"));
      });
    });
  });
});
