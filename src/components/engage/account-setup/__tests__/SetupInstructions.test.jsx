import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SetupInstructions from "../SetupInstructions";

describe("SetupInstructions", () => {
  it("renders the heading, both tips, all 3 steps, and both CTAs", () => {
    render(<SetupInstructions />);
    expect(screen.getByText("Let's Get Your WhatsApp Business Ready")).toBeInTheDocument();
    expect(screen.getByTestId("setup-tips").children).toHaveLength(2);
    expect(screen.getByTestId("setup-steps").children).toHaveLength(3);
    expect(screen.getByText("Add Your Business Details")).toBeInTheDocument();
    expect(screen.getByText("Start Embedded Signup")).toBeInTheDocument();
    expect(screen.getByText("Verify & Go Live")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-manual")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-ai")).toBeInTheDocument();
  });

  it("both CTAs are clickable without throwing (no-ops by design)", () => {
    render(<SetupInstructions />);
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    fireEvent.click(screen.getByTestId("setup-cta-ai"));
  });
});
