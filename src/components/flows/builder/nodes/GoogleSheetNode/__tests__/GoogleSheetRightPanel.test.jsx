import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GoogleSheetRightPanel from "../GoogleSheetRightPanel";
import { defaultGoogleSheetNodeData, GOOGLE_SHEET_DUMMY_COLUMNS } from "../data/mockData";

const makeNode = (data = {}) => ({ id: "n1", data: { ...defaultGoogleSheetNodeData, ...data } });
const noop = () => {};

describe("GoogleSheetRightPanel", () => {
  describe("Sheet Connection section", () => {
    it("renders Sheet URL and Sheet ID fields regardless of action", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sheet-url")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-sheet-id")).toBeInTheDocument();
    });

    it("editing Sheet URL patches sheetUrl", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
      fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/abc" } });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" }));
    });

    it("Submit is disabled until a Sheet URL is entered", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-submit")).toBeDisabled();
    });

    it("clicking Submit with a URL present marks the sheet as connected", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-submit"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetConnected: true }));
    });

    it("shows a Connected badge once sheetConnected is true", () => {
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc", sheetConnected: true })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("editing the Sheet URL after being connected clears the Connected badge", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc", sheetConnected: true })} updateNodeData={update} removeNode={noop} />);
      fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/xyz" } });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetConnected: false }));
    });

    it("Sync is disabled until a Sheet URL is entered", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sync")).toBeDisabled();
    });

    it("clicking Sync goes syncing then synced with detected column chips", () => {
      jest.useFakeTimers();
      const update = jest.fn();
      const { rerender } = render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" })} updateNodeData={update} removeNode={noop} />);

      fireEvent.click(screen.getByTestId("gsheet-sync"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        sync: expect.objectContaining({ status: "syncing" }),
      }));
      const syncingData = update.mock.calls[update.mock.calls.length - 1][1];
      rerender(<GoogleSheetRightPanel node={makeNode(syncingData)} updateNodeData={update} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sync")).toBeDisabled();

      act(() => { jest.advanceTimersByTime(1200); });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        sync: expect.objectContaining({ status: "synced", detectedColumns: GOOGLE_SHEET_DUMMY_COLUMNS }),
      }));
      const syncedData = update.mock.calls[update.mock.calls.length - 1][1];
      rerender(<GoogleSheetRightPanel node={makeNode(syncedData)} updateNodeData={update} removeNode={noop} />);
      expect(screen.getByText("Last synced just now")).toBeInTheDocument();
      GOOGLE_SHEET_DUMMY_COLUMNS.forEach((col) => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("Action picker and summary card", () => {
    it("shows action picker when no action set", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Add Row")).toBeInTheDocument();
      expect(screen.getByText("Update Row")).toBeInTheDocument();
      expect(screen.getByText("Get Row Data")).toBeInTheDocument();
      expect(screen.getByText("Upsert Row")).toBeInTheDocument();
    });

    it("selecting an action calls updateNodeData with that action and opens the config modal", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-action-add_row"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "add_row" }));
      expect(screen.getByTestId("gsheet-config-modal")).toBeInTheDocument();
    });

    it("shows a summary card and change-action link once an action is set", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row", sheetId: "" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Row added to Sheet · default")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-change-action")).toBeInTheDocument();
    });

    it("change-action resets action to null", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-change-action"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
    });

    it("clicking Edit configuration opens the modal for the current action", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "upsert_row", upsertRow: { ...defaultGoogleSheetNodeData.upsertRow, lookupColumn: "B", lookupField: "{{email}}" } })} updateNodeData={noop} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-edit-config"));
      expect(screen.getByTestId("gsheet-config-modal")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-upsertrow-lookupcolumn")).toHaveValue("B");
    });

    it("saving from the modal patches the action's sub-object on the node", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-edit-config"));
      fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
      fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        addRow: expect.objectContaining({
          fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
        }),
      }));
    });

    it("does not render per-action fields inline in the panel", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.queryByTestId("gsheet-addrow-add-field")).not.toBeInTheDocument();
    });
  });
});
