import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NumberSetupCard from "../NumberSetupCard";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderCard(overrides = {}) {
  const props = {
    mode: "has_number",
    onModeChange: jest.fn(),
    numberValue: "",
    onNumberValueChange: jest.fn(),
    virtualNumberValue: "",
    onVirtualNumberChange: jest.fn(),
    ...overrides,
  };
  render(<NumberSetupCard {...props} />);
  return props;
}

describe("NumberSetupCard", () => {
  it("defaults to has_number mode and shows only the phone input", () => {
    renderCard();
    expect(screen.getByTestId("number-setup-has-number-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-virtual-number-fields")).not.toBeInTheDocument();
  });

  it("only shows the 'I have a number' and 'Need a number' modes — no 'I have an app'", () => {
    renderCard();
    expect(screen.getByTestId("number-setup-mode-has_number")).toHaveTextContent(
      "I have a number"
    );
    expect(screen.getByTestId("number-setup-mode-needs_virtual_number")).toHaveTextContent(
      "Need a number"
    );
    expect(screen.queryByTestId("number-setup-mode-has_app")).not.toBeInTheDocument();
  });

  it("typing in the phone input calls onNumberValueChange", () => {
    const props = renderCard();
    fireEvent.change(screen.getByTestId("number-setup-phone-input"), { target: { value: "9876543210" } });
    expect(props.onNumberValueChange).toHaveBeenCalledWith("9876543210");
  });

  it("clicking the 'Need a number' toggle button calls onModeChange", () => {
    const props = renderCard();
    fireEvent.click(screen.getByTestId("number-setup-mode-needs_virtual_number"));
    expect(props.onModeChange).toHaveBeenCalledWith("needs_virtual_number");
  });

  it("in needs_virtual_number mode, shows only the virtual-number Select", () => {
    renderCard({ mode: "needs_virtual_number" });
    expect(screen.getByTestId("number-setup-virtual-number-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
  });

  it("selecting a virtual number calls onVirtualNumberChange with the chosen number, and the option shows no price", () => {
    const props = renderCard({ mode: "needs_virtual_number" });
    fireEvent.click(screen.getByTestId("number-setup-virtual-number-select"));
    expect(screen.queryByText(/₹500\/mo/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("+91 63001 22456"));
    expect(props.onVirtualNumberChange).toHaveBeenCalledWith("+91 63001 22456");
  });
});
