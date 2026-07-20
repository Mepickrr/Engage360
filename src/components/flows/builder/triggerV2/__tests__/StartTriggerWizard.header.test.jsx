import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickOrderPlaced() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

function pickCsvBroadcast() {
  fireEvent.click(screen.getByTestId("event-picker-header-Broadcast"));
  fireEvent.click(screen.getByTestId("event-picker-card-CSV upload"));
}

describe("StartTriggerWizard — simplified header and Submit footer", () => {
  it("shows the simple 'Configure Start Trigger' title with no step label, for the event trigger", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();
    expect(screen.getByRole("dialog", { name: "Configure Start Trigger" })).toBeInTheDocument();
    expect(screen.queryByText(/When will users enter the flow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Who will enter the flow/i)).not.toBeInTheDocument();
  });

  it("labels the final action Submit instead of Finish, for the event trigger", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();
    expect(screen.getByTestId("trigger-wizard-finish")).toHaveTextContent("Submit");
  });

  it("shows the simple title for broadcast-source as a single combined screen with Submit", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickCsvBroadcast();
    expect(screen.getByRole("dialog", { name: "Configure Start Trigger" })).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).toHaveTextContent("Submit");
  });
});
