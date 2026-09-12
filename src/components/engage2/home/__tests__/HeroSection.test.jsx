import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSection from "../HeroSection";

describe("HeroSection", () => {
  it("renders the eyebrow, headline, subhead, and chat preview mockup", () => {
    render(<HeroSection onEnable={() => {}} />);
    expect(screen.getByText("For D2C Brands on WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByText("Convert Every Anonymous Visitor Into a Paying Customer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-preview-mockup")).toBeInTheDocument();
    expect(screen.getByText("Cart reminder sent")).toBeInTheDocument();
    expect(screen.getByText('"Yes, still interested!"')).toBeInTheDocument();
    expect(screen.getByText("✅ Order confirmed")).toBeInTheDocument();
  });

  it("clicking the primary CTA calls onEnable", () => {
    const onEnable = jest.fn();
    render(<HeroSection onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-cta"));
    expect(onEnable).toHaveBeenCalledTimes(1);
  });

  it("the secondary CTA is a present, clickable no-op", () => {
    const onEnable = jest.fn();
    render(<HeroSection onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-secondary-cta"));
    expect(onEnable).not.toHaveBeenCalled();
  });
});
