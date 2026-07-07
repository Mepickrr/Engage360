import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetRightPanel from "../GoogleSheetRightPanel";
import { defaultGoogleSheetNodeData } from "../data/mockData";

const makeNode = (data = {}) => ({ id: "n1", data: { ...defaultGoogleSheetNodeData, ...data } });
const noop = () => {};

describe("GoogleSheetRightPanel", () => {
  it("shows action picker when no action set", () => {
    render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
    expect(screen.getByText("Update Row")).toBeInTheDocument();
    expect(screen.getByText("Get Row Data")).toBeInTheDocument();
    expect(screen.getByText("Upsert Row")).toBeInTheDocument();
  });

  it("selecting Add Row calls updateNodeData with that action", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-action-add_row"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "add_row" }));
  });

  it("shows change-action link once an action is set", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-change-action")).toBeInTheDocument();
  });

  it("change-action resets action to null", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-change-action"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
  });

  it("renders Sheet URL and Sheet ID fields for the selected action", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-sheet-url")).toBeInTheDocument();
    expect(screen.getByTestId("gsheet-sheet-id")).toBeInTheDocument();
  });

  it("editing Sheet URL patches sheetUrl", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/abc" } });
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" }));
  });

  it("clicking + Add Field appends a new field row for add_row", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
      addRow: expect.objectContaining({
        fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
      }),
    }));
  });

  it("renders the read-only row-number output variable for add_row", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-addrow-rownumbervar")).toHaveValue("googleSheetAddRow1.rowNumber");
  });

  describe("update_row action", () => {
    it("defaults to Search for Row mode with lookup fields", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-updaterow-lookupcolumn")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-updaterow-lookupfield")).toBeInTheDocument();
    });

    it("switching to Specify Row Number shows a row-number input", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-updaterow-targetmode-row_number"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        updateRow: expect.objectContaining({ targetMode: "row_number" }),
      }));
    });

    it("renders row-number input when targetMode is row_number", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row", updateRow: { ...defaultGoogleSheetNodeData.updateRow, targetMode: "row_number" } })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-updaterow-rownumber")).toBeInTheDocument();
    });

    it("clicking + Add Field appends a second field row to update", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-updaterow-add-field"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        updateRow: expect.objectContaining({
          fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
        }),
      }));
    });
  });
});
