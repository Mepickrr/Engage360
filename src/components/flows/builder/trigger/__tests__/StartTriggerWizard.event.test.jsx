import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickOrderPlaced() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

describe("StartTriggerWizard — merged single screen (Event trigger)", () => {
  it("shows the When content and the Who content on the same screen, with no Next/Back buttons", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();

    expect(screen.getByTestId("trigger-group-0")).toBeInTheDocument();
    expect(screen.getByTestId("audience-all-users")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).toBeInTheDocument();
  });

  it("finishes with kind: event and the configured audience, without a Next click", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickOrderPlaced();

    fireEvent.click(screen.getByTestId("audience-filter-users"));
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "event",
        audience: expect.objectContaining({ include_all: false }),
      }),
    );
  });
});
