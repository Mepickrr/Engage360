import React from "react";
import { render, screen } from "@testing-library/react";
import GoogleSheetNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: "top", Right: "right" },
}));

const baseNode = { id: "n1", data: {} };

describe("GoogleSheetNode", () => {
  it("renders unconfigured state", () => {
    render(<GoogleSheetNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("rf-google-sheet-node-n1")).toBeInTheDocument();
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders configured state for add_row with preview line", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "add_row", sheetId: "" }} selected={false} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
    expect(screen.getByText('Row added to Sheet · default')).toBeInTheDocument();
  });

  it("renders configured state for update_row search mode", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "update_row", updateRow: { targetMode: "search", lookupColumn: "A", lookupField: "{{Order ID}}" } }} selected={false} />);
    expect(screen.getByText("Row updated where A = {{Order ID}}")).toBeInTheDocument();
  });

  it("renders configured state for upsert_row", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "upsert_row", upsertRow: { lookupColumn: "B", lookupField: "{{email}}" } }} selected={false} />);
    expect(screen.getByText("Row added or updated where B = {{email}}")).toBeInTheDocument();
  });

  it("renders Success and Failed handles", () => {
    render(<GoogleSheetNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("handle-success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-failed")).toBeInTheDocument();
  });
});
