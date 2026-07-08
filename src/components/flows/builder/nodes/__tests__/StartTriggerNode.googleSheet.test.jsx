import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const googleSheetConfig = {
  kind: "google_sheet_new_row",
  sheetUrl: "https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz",
  sheetId: "",
  columnIdMode: "id",
  columns: ["A", "B"],
  contactIdentifierColumn: "A",
  pollIntervalMinutes: 15,
  sampleValues: {},
};

describe("StartTriggerNode — Google Sheet Data Entry trigger", () => {
  it("renders the sheet URL and the poll interval instead of the event entry list", () => {
    render(<StartTriggerNode data={{ config: googleSheetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Checked every 15 minutes/)).toBeInTheDocument();
  });

  it("shows the contact identifier column and captured column count", () => {
    render(<StartTriggerNode data={{ config: googleSheetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Contact: A · 2 columns captured/)).toBeInTheDocument();
  });

  it("uses singular wording for a single captured column and 1-minute interval", () => {
    const singleColumn = { ...googleSheetConfig, columns: ["A"], pollIntervalMinutes: 1 };
    render(<StartTriggerNode data={{ config: singleColumn, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Checked every 1 minute\b/)).toBeInTheDocument();
    expect(screen.getByText(/1 column captured/)).toBeInTheDocument();
  });
});
