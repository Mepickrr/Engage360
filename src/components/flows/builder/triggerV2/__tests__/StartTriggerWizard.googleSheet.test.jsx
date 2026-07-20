import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickGoogleSheetTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Google Sheet Data Entry"));
}

// Drives the internal 4-step Google Sheet config flow to completion using the
// default header-based mode, ending on Step 4 (Trigger behavior) where the
// outer wizard's Finish button is expected to be enabled.
function completeGoogleSheetSteps() {
  fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), { target: { value: "https://docs.google.com/x" } });
  fireEvent.click(screen.getByTestId("gsheet-trigger-connect-btn"));
  fireEvent.click(screen.getByTestId("gsheet-trigger-step1-continue"));
  fireEvent.click(screen.getByTestId("gsheet-trigger-step2-continue"));
  fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "Phone Number" } });
}

describe("StartTriggerWizard — Google Sheet Data Entry trigger", () => {
  it("routes to GoogleSheetTriggerStep1 instead of Step1WhenContent when picked", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickGoogleSheetTrigger();
    expect(screen.getByTestId("google-sheet-step1")).toBeInTheDocument();
  });

  it("skips straight to a Finish button (no Step 2) and disables it until Step 1 is valid", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickGoogleSheetTrigger();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).toBeDisabled();

    completeGoogleSheetSteps();
    expect(screen.getByTestId("trigger-wizard-finish")).not.toBeDisabled();
  });

  it("finishes with a kind: google_sheet_new_row config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickGoogleSheetTrigger();

    completeGoogleSheetSteps();
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "google_sheet_new_row",
        sheetUrl: "https://docs.google.com/x",
        contactIdentifierColumn: "Phone Number",
        pollIntervalMinutes: 5,
      }),
    );
  });

  it("skips Step 2 when re-opening an existing saved google_sheet_new_row trigger for editing", () => {
    const savedConfig = {
      kind: "google_sheet_new_row",
      sheetUrl: "https://docs.google.com/x",
      sheetId: "",
      columnIdMode: "id",
      columns: ["A"],
      contactIdentifierColumn: "A",
      pollIntervalMinutes: 5,
      sampleValues: {},
    };
    render(
      <StartTriggerWizard open initialConfig={savedConfig} onClose={() => {}} onComplete={() => {}} />,
    );
    expect(screen.getByTestId("trigger-wizard-finish")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).not.toBeDisabled();
  });
});
