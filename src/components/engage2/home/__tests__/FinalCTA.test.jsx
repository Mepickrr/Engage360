import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FinalCTA from "../FinalCTA";

describe("FinalCTA", () => {
  it("renders the heading, subcopy, and CTA", () => {
    render(<FinalCTA onEnable={() => {}} />);
    expect(screen.getByText("Quick Onboarding, Real Results")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-onboarding-cta")).toBeInTheDocument();
  });

  it("clicking the CTA calls onEnable", () => {
    const onEnable = jest.fn();
    render(<FinalCTA onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-onboarding-cta"));
    expect(onEnable).toHaveBeenCalledTimes(1);
  });
});
