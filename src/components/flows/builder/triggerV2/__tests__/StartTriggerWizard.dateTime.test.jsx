import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickDateAndTimeCard(cardName) {
  fireEvent.click(screen.getByTestId("event-picker-header-Date and time"));
  fireEvent.click(screen.getByTestId(`event-picker-card-${cardName}`));
}

describe("StartTriggerWizard — Date and time section", () => {
  it("routes user-attribute date cards to DateRelativeTriggerContent, not the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Birthday");
    expect(screen.queryByTestId("trigger-wizard-back")).toBeInTheDocument();
    expect(screen.queryByText(/Add evaluate rule/i)).not.toBeInTheDocument();
  });

  it("pre-selects the clicked card's date attribute and finishes with it", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Birthday");

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "date_relative",
        dateConfig: expect.objectContaining({ attribute: "date_of_birth" }),
      }),
    );
  });

  it("pre-selects Account Created's attribute distinctly from Birthday's", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Account Created");

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        dateConfig: expect.objectContaining({ attribute: "account_created" }),
      }),
    );
  });

  it("routes Back in Stock to EventOffsetTriggerContent instead of the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Back in Stock");
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
  });

  it("still shows the Who-enters-the-flow content for Back in Stock, then finishes with kind: event_offset", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Back in Stock");

    expect(screen.getByTestId("audience-filter-users")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "event_offset",
        eventOffsetConfig: expect.objectContaining({ event: "Back in Stock", value: 1, unit: "Hours" }),
      }),
    );
  });

  it("hydrates an existing event_offset config back into EventOffsetTriggerContent on edit", () => {
    const initialConfig = {
      kind: "event_offset",
      eventOffsetConfig: { event: "Price Drop", value: 2, unit: "Days" },
      audience: { include_all: true },
    };
    render(<StartTriggerWizard open initialConfig={initialConfig} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(2);
  });
});
