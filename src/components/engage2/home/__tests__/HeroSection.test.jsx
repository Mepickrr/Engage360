import React from "react";
import { render, screen } from "@testing-library/react";
import HeroSection from "../HeroSection";

describe("HeroSection", () => {
  it("renders a personalized headline and subhead computed from the store's mock activity, and the chat preview mockup", () => {
    render(<HeroSection />);
    // monthlyRevenueAtRisk = 4,000/day * ₹100 AOV * 30 days = ₹1,20,00,000 -> formatCompactCurrency -> "₹1.2C"
    expect(screen.getByTestId("hero-headline")).toHaveTextContent(
      "₹1.2C a month is walking out through your checkout."
    );
    expect(screen.getByTestId("hero-subhead")).toHaveTextContent(
      "4,000 shoppers a day abandon before paying"
    );
    expect(screen.getByTestId("chat-preview-mockup")).toBeInTheDocument();
  });

  it("no longer renders the old CTA buttons", () => {
    render(<HeroSection />);
    expect(screen.queryByTestId("fastrr-engage-hero-cta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fastrr-engage-hero-secondary-cta")).not.toBeInTheDocument();
  });
});
