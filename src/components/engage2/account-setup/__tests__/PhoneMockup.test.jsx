import React from "react";
import { render, screen } from "@testing-library/react";
import PhoneMockup from "../PhoneMockup";

describe("PhoneMockup", () => {
  it("renders the device chrome (status bar, notch) and its children inside the screen area", () => {
    render(
      <PhoneMockup>
        <div data-testid="mock-child">Hello</div>
      </PhoneMockup>
    );
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-status-bar")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-notch")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-screen")).toContainElement(
      screen.getByTestId("mock-child")
    );
  });
});
