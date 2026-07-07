export const GOOGLE_SHEET_BLUE = "#378ADD";

export const GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL = "engagetechsupport@shiprocket.com";

export const GOOGLE_SHEET_ACTIONS = [
  { id: "add_row",    label: "Add Row",     desc: "Insert a new row into the sheet" },
  { id: "update_row", label: "Update Row",  desc: "Modify an existing row's data" },
  { id: "get_row",    label: "Get Row Data", desc: "Retrieve data from a row" },
  { id: "upsert_row", label: "Upsert Row",  desc: "Update a row if found, else add a new one" },
];

export const COLUMN_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export const defaultGoogleSheetNodeData = {
  action: null, // "add_row" | "update_row" | "get_row" | "upsert_row"

  sheetUrl: "",
  sheetId: "",

  addRow: {
    columnIdMode: "id", // "header" | "id"
    fields: [{ column: "A", field: "" }],
    rowNumberVar: "googleSheetAddRow1.rowNumber",
  },

  updateRow: {
    targetMode: "search", // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    fields: [{ column: "A", field: "" }],
  },

  getRow: {
    targetMode: "search", // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    columns: [],
    outputVarPrefix: "googleSheetGetRowData1",
  },

  upsertRow: {
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    fields: [{ column: "A", field: "" }],
    rowNumberVar: "googleSheetUpsertRow1.rowNumber",
    wasAddedVar: "googleSheetUpsertRow1.wasAdded",
  },
};
