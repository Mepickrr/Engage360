import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetTriggerStep1, { isGoogleSheetStep1Valid } from "../GoogleSheetTriggerStep1";
import { emptyGoogleSheetTriggerConfig, MOCK_DETECTED_COLUMNS } from "../googleSheetTriggerHelpers";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial || emptyGoogleSheetTriggerConfig());
  return <GoogleSheetTriggerStep1 config={config} setConfig={setConfig} />;
}

function connect() {
  fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), {
    target: { value: "https://docs.google.com/spreadsheets/d/abc" },
  });
  fireEvent.click(screen.getByTestId("gsheet-trigger-connect-btn"));
}

describe("GoogleSheetTriggerStep1 — Step 1 (Connect)", () => {
  it("updates the sheet URL and shows Not connected before Connect is clicked", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), {
      target: { value: "https://docs.google.com/spreadsheets/d/abc" },
    });
    expect(screen.getByTestId("gsheet-trigger-sheet-url")).toHaveValue("https://docs.google.com/spreadsheets/d/abc");
    expect(screen.getByTestId("gsheet-trigger-connection-status")).toHaveTextContent("Not connected");
  });

  it("connects and reveals the Connected status, keeping Sheet ID under Advanced settings", () => {
    render(<Harness />);
    expect(screen.queryByTestId("gsheet-trigger-sheet-id")).not.toBeInTheDocument();
    connect();
    expect(screen.getByTestId("gsheet-trigger-connection-status")).toHaveTextContent("Connected");
    fireEvent.click(screen.getByTestId("gsheet-trigger-advanced-toggle"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-id"), { target: { value: "999" } });
    expect(screen.getByTestId("gsheet-trigger-sheet-id")).toHaveValue("999");
  });

  it("disables Continue until connected", () => {
    render(<Harness />);
    expect(screen.getByTestId("gsheet-trigger-step1-continue")).toBeDisabled();
    connect();
    expect(screen.getByTestId("gsheet-trigger-step1-continue")).not.toBeDisabled();
  });

  it("shows the shared service-account access note", () => {
    render(<Harness />);
    expect(screen.getByText(/engagetechsupport@shiprocket.com/)).toBeInTheDocument();
  });
});

describe("GoogleSheetTriggerStep1 — Step 2 (Read sheet)", () => {
  it("shows detected columns in header mode by default after connecting", () => {
    render(<Harness />);
    connect();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
    expect(screen.getByTestId("gsheet-trigger-header-toggle")).toBeChecked();
    const preview = screen.getByTestId("gsheet-trigger-detected-columns");
    MOCK_DETECTED_COLUMNS.forEach((c) => expect(preview).toHaveTextContent(c));
    expect(screen.getByText(/Only rows added after this trigger is turned on/)).toBeInTheDocument();
  });

  it("switches to letter mode and clears any captured columns", () => {
    render(<Harness />);
    connect();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
    fireEvent.click(screen.getByTestId("gsheet-trigger-header-toggle"));
    expect(screen.getByTestId("gsheet-trigger-header-toggle")).not.toBeChecked();
    expect(screen.queryByTestId("gsheet-trigger-detected-columns")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step2-continue"));
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toBeDisabled();
  });
});

describe("GoogleSheetTriggerStep1 — Step 3 (Contact & variables, header mode)", () => {
  function goToStep3() {
    connect();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
    fireEvent.click(screen.getByTestId("gsheet-trigger-step2-continue"));
  }

  it("pre-checks every detected column with an auto-generated variable name", () => {
    render(<Harness />);
    goToStep3();
    expect(screen.getByTestId("gsheet-trigger-map-checkbox-Customer Name")).toBeChecked();
    expect(screen.getByTestId("gsheet-trigger-map-varname-Customer Name")).toHaveValue("customer_name");
    expect(screen.getByTestId("gsheet-trigger-map-varname-Phone Number")).toHaveValue("phone_number");
  });

  it("lets the seller uncheck a column, removing it from the contact-column options", () => {
    render(<Harness />);
    goToStep3();
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "Phone Number" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-map-checkbox-Phone Number"));
    expect(screen.getByTestId("gsheet-trigger-map-checkbox-Phone Number")).not.toBeChecked();
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("");
  });

  it("lets the seller edit the auto-generated variable name", () => {
    render(<Harness />);
    goToStep3();
    fireEvent.change(screen.getByTestId("gsheet-trigger-map-varname-Phone Number"), { target: { value: "mobile" } });
    expect(screen.getByTestId("gsheet-trigger-map-varname-Phone Number")).toHaveValue("mobile");
  });

  it("picks a contact identifier column from the mapped columns", () => {
    render(<Harness />);
    goToStep3();
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "Phone Number" } });
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("Phone Number");
  });

  it("disables Continue until a contact column is chosen", () => {
    render(<Harness />);
    goToStep3();
    expect(screen.getByTestId("gsheet-trigger-step3-continue")).toBeDisabled();
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "Phone Number" } });
    expect(screen.getByTestId("gsheet-trigger-step3-continue")).not.toBeDisabled();
  });
});

describe("GoogleSheetTriggerStep1 — Step 3 (letter/id mode fallback)", () => {
  function goToStep3Letters() {
    connect();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
    fireEvent.click(screen.getByTestId("gsheet-trigger-header-toggle"));
    fireEvent.click(screen.getByTestId("gsheet-trigger-step2-continue"));
  }

  it("adds columns by letter and removes them", () => {
    render(<Harness />);
    goToStep3Letters();
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "B" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    expect(screen.getByTestId("gsheet-trigger-column-chips")).toHaveTextContent("B");
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-remove-B"));
    expect(screen.queryByTestId("gsheet-trigger-column-chips")).not.toBeInTheDocument();
  });

  it("lets the seller name a letter-based column and pick it as the contact identifier", () => {
    render(<Harness />);
    goToStep3Letters();
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-map-varname-A"), { target: { value: "phone" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("A");
  });
});

describe("GoogleSheetTriggerStep1 — Step 4 (Trigger behavior)", () => {
  function goToStep4() {
    connect();
    fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
    fireEvent.click(screen.getByTestId("gsheet-trigger-step2-continue"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "Phone Number" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-step3-continue"));
  }

  it("defaults the poll interval to 5 minutes and allows changing it", () => {
    render(<Harness />);
    goToStep4();
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("5");
    fireEvent.change(screen.getByTestId("gsheet-trigger-poll-interval"), { target: { value: "15" } });
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("15");
  });

  it("simulates a new row from sample values and shows the resolved contact value", () => {
    render(<Harness />);
    goToStep4();
    fireEvent.change(screen.getByTestId("gsheet-trigger-sample-Phone Number"), { target: { value: "+919999999999" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-simulate-btn"));
    expect(screen.getByTestId("gsheet-trigger-simulate-result")).toHaveTextContent("Contact resolved to +919999999999");
  });

  it("shows the trigger-behavior summary", () => {
    render(<Harness />);
    goToStep4();
    expect(screen.getByText(/Only newly added rows trigger the flow/)).toBeInTheDocument();
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
