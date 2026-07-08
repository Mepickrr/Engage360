import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickGoogleSheetTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Google Sheet Data Entry"));
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

    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), { target: { value: "https://docs.google.com/x" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    expect(screen.getByTestId("trigger-wizard-finish")).not.toBeDisabled();
  });

  it("finishes with a kind: google_sheet_new_row config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickGoogleSheetTrigger();

    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), { target: { value: "https://docs.google.com/x" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "google_sheet_new_row",
        sheetUrl: "https://docs.google.com/x",
        columns: ["A"],
        contactIdentifierColumn: "A",
        pollIntervalMinutes: 5,
      }),
    );
  });
});
