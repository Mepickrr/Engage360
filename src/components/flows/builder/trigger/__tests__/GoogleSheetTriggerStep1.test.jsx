import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetTriggerStep1, { isGoogleSheetStep1Valid } from "../GoogleSheetTriggerStep1";
import { emptyGoogleSheetTriggerConfig } from "../googleSheetTriggerHelpers";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial || emptyGoogleSheetTriggerConfig());
  return <GoogleSheetTriggerStep1 config={config} setConfig={setConfig} />;
}

describe("GoogleSheetTriggerStep1", () => {
  it("updates the sheet URL and sheet ID fields", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), {
      target: { value: "https://docs.google.com/spreadsheets/d/abc" },
    });
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-id"), { target: { value: "999" } });
    expect(screen.getByTestId("gsheet-trigger-sheet-url")).toHaveValue("https://docs.google.com/spreadsheets/d/abc");
    expect(screen.getByTestId("gsheet-trigger-sheet-id")).toHaveValue("999");
  });

  it("adds columns by letter in Id mode and removes them", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "B" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    expect(screen.getByTestId("gsheet-trigger-column-chips")).toHaveTextContent("B");
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-remove-B"));
    expect(screen.queryByTestId("gsheet-trigger-column-chips")).not.toBeInTheDocument();
  });

  it("adds columns by typed header text in Header mode", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("gsheet-trigger-colmode-header"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-text"), { target: { value: "Customer Name" } });
    fireEvent.keyDown(screen.getByTestId("gsheet-trigger-column-text"), { key: "Enter" });
    expect(screen.getByTestId("gsheet-trigger-column-chips")).toHaveTextContent("Customer Name");
  });

  it("clears columns and contact identifier when switching column identifier mode", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-colmode-header"));
    expect(screen.queryByTestId("gsheet-trigger-column-chips")).not.toBeInTheDocument();
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("");
  });

  it("lets the seller pick a contact identifier column from the captured columns", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("A");
  });

  it("defaults the poll interval to 5 minutes and allows changing it", () => {
    render(<Harness />);
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("5");
    fireEvent.change(screen.getByTestId("gsheet-trigger-poll-interval"), { target: { value: "15" } });
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("15");
  });

  it("simulates a new row from sample values and shows the resolved contact value", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-sample-A"), { target: { value: "+919999999999" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-simulate-btn"));
    expect(screen.getByTestId("gsheet-trigger-simulate-result")).toHaveTextContent("Contact resolved to +919999999999");
  });

  it("shows the shared service-account tip and baseline notice", () => {
    render(<Harness />);
    expect(screen.getByText(/engagetechsupport@shiprocket.com/)).toBeInTheDocument();
    expect(screen.getByText(/Only rows added after you save this trigger/)).toBeInTheDocument();
  });
});

describe("isGoogleSheetStep1Valid", () => {
  it("is false with no sheet URL, columns, or contact column", () => {
    expect(isGoogleSheetStep1Valid(emptyGoogleSheetTriggerConfig())).toBe(false);
  });

  it("is false with a sheet URL and columns but no contact identifier column", () => {
    const cfg = { ...emptyGoogleSheetTriggerConfig(), sheetUrl: "https://x", columns: ["A"] };
    expect(isGoogleSheetStep1Valid(cfg)).toBe(false);
  });

  it("is true once sheet URL, at least one column, and a contact identifier column are set", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      sheetUrl: "https://x",
      columns: ["A"],
      contactIdentifierColumn: "A",
    };
    expect(isGoogleSheetStep1Valid(cfg)).toBe(true);
  });
});
