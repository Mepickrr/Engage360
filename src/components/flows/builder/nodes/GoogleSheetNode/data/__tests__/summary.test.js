import { getGoogleSheetSummary, getGoogleSheetPanelSummary } from "../summary";

describe("getGoogleSheetSummary", () => {
  it("returns null when no action is set", () => {
    expect(getGoogleSheetSummary({})).toBeNull();
    expect(getGoogleSheetSummary(null)).toBeNull();
  });

  it("summarizes add_row with the sheet id or 'default'", () => {
    expect(getGoogleSheetSummary({ action: "add_row", sheetId: "" })).toBe("Row added to Sheet · default");
    expect(getGoogleSheetSummary({ action: "add_row", sheetId: "123" })).toBe("Row added to Sheet · 123");
  });

  it("summarizes update_row in search mode", () => {
    expect(getGoogleSheetSummary({
      action: "update_row",
      updateRow: { targetMode: "search", lookupColumn: "A", lookupField: "{{Order ID}}" },
    })).toBe("Row updated where A = {{Order ID}}");
  });

  it("summarizes update_row in row_number mode", () => {
    expect(getGoogleSheetSummary({
      action: "update_row",
      updateRow: { targetMode: "row_number", rowNumber: 5 },
    })).toBe("Row #5 updated");
  });

  it("summarizes get_row in search mode", () => {
    expect(getGoogleSheetSummary({
      action: "get_row",
      getRow: { targetMode: "search", lookupColumn: "B", lookupField: "{{email}}" },
    })).toBe("Row fetched where B = {{email}}");
  });

  it("summarizes get_row in row_number mode", () => {
    expect(getGoogleSheetSummary({
      action: "get_row",
      getRow: { targetMode: "row_number", rowNumber: 9 },
    })).toBe("Row #9 fetched");
  });

  it("summarizes upsert_row", () => {
    expect(getGoogleSheetSummary({
      action: "upsert_row",
      upsertRow: { lookupColumn: "B", lookupField: "{{email}}" },
    })).toBe("Row added or updated where B = {{email}}");
  });
});

describe("getGoogleSheetPanelSummary", () => {
  it("appends a field-mapped count for add_row", () => {
    expect(getGoogleSheetPanelSummary({
      action: "add_row",
      sheetId: "",
      addRow: { fields: [{ column: "A", field: "" }, { column: "B", field: "" }] },
    })).toBe("Row added to Sheet · default · 2 field(s) mapped");
  });

  it("appends a field-mapped count for upsert_row", () => {
    expect(getGoogleSheetPanelSummary({
      action: "upsert_row",
      upsertRow: {
        lookupColumn: "B", lookupField: "{{email}}",
        fields: [{ column: "A", field: "" }],
      },
    })).toBe("Row added or updated where B = {{email}} · 1 field(s) mapped");
  });

  it("does not append a count for update_row or get_row", () => {
    expect(getGoogleSheetPanelSummary({
      action: "update_row",
      updateRow: { targetMode: "row_number", rowNumber: 5 },
    })).toBe("Row #5 updated");
  });

  it("returns null when no action is set", () => {
    expect(getGoogleSheetPanelSummary({})).toBeNull();
  });
});
