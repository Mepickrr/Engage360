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
    appId: "",
    onAppIdChange: jest.fn(),
    apiKeySecret: "",
    onApiKeySecretChange: jest.fn(),
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
    expect(screen.queryByTestId("number-setup-has-app-fields")).not.toBeInTheDocument();
  });

  it("typing in the phone input calls onNumberValueChange", () => {
    const props = renderCard();
    fireEvent.change(screen.getByTestId("number-setup-phone-input"), { target: { value: "9876543210" } });
    expect(props.onNumberValueChange).toHaveBeenCalledWith("9876543210");
  });

  it("clicking the 'Need a virtual number' toggle button calls onModeChange", () => {
    const props = renderCard();
    fireEvent.click(screen.getByTestId("number-setup-mode-needs_virtual_number"));
    expect(props.onModeChange).toHaveBeenCalledWith("needs_virtual_number");
  });

  it("in needs_virtual_number mode, shows only the virtual-number Select", () => {
    renderCard({ mode: "needs_virtual_number" });
    expect(screen.getByTestId("number-setup-virtual-number-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-app-fields")).not.toBeInTheDocument();
  });

  it("selecting a virtual number calls onVirtualNumberChange with the chosen number", () => {
    const props = renderCard({ mode: "needs_virtual_number" });
    fireEvent.click(screen.getByTestId("number-setup-virtual-number-select"));
    fireEvent.click(screen.getByText("+91 63001 22456 — ₹500/mo"));
    expect(props.onVirtualNumberChange).toHaveBeenCalledWith("+91 63001 22456");
  });

  it("in has_app mode, shows only the App ID and API Key Secret inputs and calls their handlers", () => {
    const props = renderCard({ mode: "has_app" });
    expect(screen.getByTestId("number-setup-has-app-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-virtual-number-fields")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("number-setup-app-id-input"), { target: { value: "app-123" } });
    expect(props.onAppIdChange).toHaveBeenCalledWith("app-123");

    fireEvent.change(screen.getByTestId("number-setup-api-key-input"), { target: { value: "secret-xyz" } });
    expect(props.onApiKeySecretChange).toHaveBeenCalledWith("secret-xyz");
  });
});
