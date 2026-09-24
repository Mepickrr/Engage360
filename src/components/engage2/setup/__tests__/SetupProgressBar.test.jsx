import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SetupProgressBar from "../SetupProgressBar";

describe("SetupProgressBar", () => {
  it("renders all 3 step labels", () => {
    render(<SetupProgressBar currentStep={0} furthestStep={0} onStepClick={() => {}} />);
    expect(screen.getByText("Select journeys")).toBeInTheDocument();
    expect(screen.getByText("Fund wallet")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Account Setup")).toBeInTheDocument();
  });

  it("clicking a step within furthestStep calls onStepClick with that index", () => {
    const onStepClick = jest.fn();
    render(<SetupProgressBar currentStep={1} furthestStep={1} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByTestId("setup-progress-step-0"));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("clicking a step beyond furthestStep does nothing (button is disabled)", () => {
    const onStepClick = jest.fn();
    render(<SetupProgressBar currentStep={0} furthestStep={0} onStepClick={onStepClick} />);
    expect(screen.getByTestId("setup-progress-step-2")).toBeDisabled();
    fireEvent.click(screen.getByTestId("setup-progress-step-2"));
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it("shows an already-reached step as done even after jumping back to an earlier step", () => {
    render(<SetupProgressBar currentStep={0} furthestStep={2} onStepClick={() => {}} />);
    // Step 2 was already reached (furthestStep=2) but we've jumped back to
    // step 0 — it should still render as "done" (green), not "upcoming".
    const step2Bar = screen.getByTestId("setup-progress-step-2").querySelector("span");
    expect(step2Bar).toHaveClass("bg-success");
  });
});
