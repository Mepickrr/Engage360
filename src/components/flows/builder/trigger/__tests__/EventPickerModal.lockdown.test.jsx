import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EventPickerModal from "../EventPickerModal";

describe("EventPickerModal — lockdown mode", () => {
  it("shows Save draft and Delete flow instead of a close button when locked", () => {
    render(
      <EventPickerModal
        open
        onClose={() => {}}
        onPick={() => {}}
        lockdown
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    expect(screen.getByTestId("trigger-wizard-save-draft")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-delete-flow")).toBeInTheDocument();
  });

  it("does not call onClose on Escape when locked", () => {
    const onClose = jest.fn();
    render(
      <EventPickerModal
        open
        onClose={onClose}
        onPick={() => {}}
        lockdown
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders no Save draft/Delete flow buttons when lockdown is false", () => {
    render(<EventPickerModal open onClose={() => {}} onPick={() => {}} />);
    expect(screen.queryByTestId("trigger-wizard-save-draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-delete-flow")).not.toBeInTheDocument();
  });
});
