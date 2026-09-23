import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppSetupStep from "../WhatsAppSetupStep";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("WhatsAppSetupStep", () => {
  it("pre-fills Mystore1 and other sample business details, editable", () => {
    render(<WhatsAppSetupStep onConfirm={() => {}} />);
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Mystore1");
    expect(screen.getByTestId("field-website")).toHaveValue("mystore1.in");
    expect(screen.getByTestId("field-email")).toHaveValue("hello@mystore1.in");
    expect(screen.getByTestId("field-support-number")).toHaveValue("+91 98765 43210");
    expect(screen.getByTestId("number-setup-phone-input")).toHaveValue("98765 43210");

    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Avimee");
  });

  it("clicking either signup CTA writes the current form snapshot to localStorage and calls onConfirm", () => {
    const onConfirm = jest.fn();
    render(<WhatsAppSetupStep onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId("setup-cta-manual"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.brandName).toBe("Mystore1");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
