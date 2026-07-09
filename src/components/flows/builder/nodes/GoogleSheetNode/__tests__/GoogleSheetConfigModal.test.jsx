import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetConfigModal from "../GoogleSheetConfigModal";
import { defaultGoogleSheetNodeData } from "../data/mockData";

const noop = () => {};

describe("GoogleSheetConfigModal", () => {
  it("renders nothing when closed", () => {
    render(<GoogleSheetConfigModal open={false} action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.queryByTestId("gsheet-config-modal")).not.toBeInTheDocument();
  });

  it("shows the action label as the modal title", () => {
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
  });

  it("does not render Sheet URL or Sheet ID fields", () => {
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.queryByTestId("gsheet-sheet-url")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gsheet-sheet-id")).not.toBeInTheDocument();
  });

  it("add_row: renders field list, adding a field updates local state, and Save commits it", () => {
    const onSave = jest.fn();
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
    }));
  });

  it("add_row: Cancel discards local edits and calls onClose without onSave", () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-cancel"));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("update_row: defaults to search mode with lookup fields, and switching to row_number swaps the input", () => {
    render(<GoogleSheetConfigModal open action="update_row" initialData={defaultGoogleSheetNodeData.updateRow} onClose={noop} onSave={noop} />);
    expect(screen.getByTestId("gsheet-updaterow-lookupcolumn")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gsheet-updaterow-targetmode-row_number"));
    expect(screen.getByTestId("gsheet-updaterow-rownumber")).toBeInTheDocument();
  });

  it("get_row: adding a column via the Id-mode picker appends it as a chip, Save commits the columns", () => {
    const onSave = jest.fn();
    render(<GoogleSheetConfigModal open action="get_row" initialData={defaultGoogleSheetNodeData.getRow} onClose={noop} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-getrow-column-add"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ columns: ["A"] }));
  });

  it("upsert_row: renders lookup fields and both read-only output variables", () => {
    render(<GoogleSheetConfigModal open action="upsert_row" initialData={defaultGoogleSheetNodeData.upsertRow} onClose={noop} onSave={noop} />);
    expect(screen.getByTestId("gsheet-upsertrow-lookupcolumn")).toBeInTheDocument();
    expect(screen.getByTestId("gsheet-upsertrow-rownumbervar")).toHaveValue("googleSheetUpsertRow1.rowNumber");
    expect(screen.getByTestId("gsheet-upsertrow-wasaddedvar")).toHaveValue("googleSheetUpsertRow1.wasAdded");
  });
});
