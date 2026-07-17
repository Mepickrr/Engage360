import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickAnyEventTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

describe("StartTriggerWizard — lockdown mode", () => {
  it("shows Save draft and Delete flow instead of a close button when locked", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    expect(screen.getByTestId("trigger-wizard-save-draft")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-delete-flow")).toBeInTheDocument();
  });

  it("calls onSaveDraft / onDeleteFlow when their buttons are clicked", () => {
    const onSaveDraft = jest.fn();
    const onDeleteFlow = jest.fn();
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={onSaveDraft}
        onDeleteFlow={onDeleteFlow}
      />,
    );
    fireEvent.click(screen.getByTestId("trigger-wizard-save-draft"));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("trigger-wizard-delete-flow"));
    expect(onDeleteFlow).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose on Escape when locked", () => {
    const onClose = jest.fn();
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={onClose}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("hides the footer Cancel button on step1 when locked, after picking a trigger", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    pickAnyEventTrigger();
    expect(screen.getByTestId("trigger-wizard")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-back")).not.toBeInTheDocument();
  });

  it("still shows Back (not Cancel) on step2 when locked", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    expect(screen.getByTestId("trigger-wizard-back")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-back")).toHaveTextContent("Back");
  });

  it("renders the normal close button and Cancel when lockdown is false (editing)", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        onClose={() => {}}
        onComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId("trigger-wizard-save-draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-delete-flow")).not.toBeInTheDocument();
    pickAnyEventTrigger();
    expect(screen.getByTestId("trigger-wizard-back")).toHaveTextContent("Cancel");
  });
});
