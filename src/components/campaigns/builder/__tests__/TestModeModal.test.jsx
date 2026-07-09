import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestModeModal from "../TestModeModal";

describe("TestModeModal", () => {
  it("disables Send Test until a phone number is entered, then calls onClose after sending", () => {
    const onClose = jest.fn();
    render(<TestModeModal open onClose={onClose} />);
    expect(screen.getByTestId("test-mode-send-btn")).toBeDisabled();
    fireEvent.change(screen.getByTestId("test-mode-phone-input"), { target: { value: "+919876543210" } });
    expect(screen.getByTestId("test-mode-send-btn")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("test-mode-send-btn"));
    expect(onClose).toHaveBeenCalled();
  });
});
