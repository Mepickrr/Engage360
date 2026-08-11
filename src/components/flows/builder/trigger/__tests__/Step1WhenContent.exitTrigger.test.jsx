import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickAnyEventTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

describe("Step1WhenContent — Exit Trigger OR-only combination (v1)", () => {
  it("shows no combinator with a single exit trigger row", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-toggle-exit"));
    expect(screen.queryByTestId("exit-row-combinator-1")).not.toBeInTheDocument();
  });

  it("shows a static OR combinator (not a togglable AND/OR pill) between multiple exit trigger rows", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-toggle-exit"));
    fireEvent.click(screen.getByTestId("exit-add-row"));

    const combinator = screen.getByTestId("exit-row-combinator-1");
    expect(combinator).toHaveTextContent("OR");
    expect(combinator.querySelector("button")).not.toBeInTheDocument();
  });

  it("adds another OR combinator for a third exit trigger row", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-toggle-exit"));
    fireEvent.click(screen.getByTestId("exit-add-row"));
    fireEvent.click(screen.getByTestId("exit-add-row"));

    expect(screen.getByTestId("exit-row-combinator-1")).toHaveTextContent("OR");
    expect(screen.getByTestId("exit-row-combinator-2")).toHaveTextContent("OR");
  });

  it("labels the add-another-exit-event button distinctly from the attribute 'Add condition' button", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-toggle-exit"));

    expect(screen.getByTestId("exit-add-row")).toHaveTextContent("Add exit event");
    expect(screen.queryByTestId("exit-add-row")).not.toHaveTextContent("Add condition");
  });
});
