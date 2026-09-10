import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

describe("FastrrEngagePage", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
    mockNavigate.mockClear();
  });

  it("opens the panel automatically on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("renders the page wrapper, hero, stats bar, and feature grid", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(
      screen.getByText("Convert Every Anonymous Visitor Into a Paying Customer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-revenue-opportunity")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-stats-bar")).toBeInTheDocument();
    expect(screen.getByText("20%+")).toBeInTheDocument();
    expect(screen.getByText("25%+")).toBeInTheDocument();
    expect(screen.getByText("20X+")).toBeInTheDocument();
    expect(screen.getByText("2B+")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-feature-grid")).toBeInTheDocument();
    expect(screen.getByText("Identify Anonymous Shoppers")).toBeInTheDocument();
    expect(screen.getByText("Conversational Commerce")).toBeInTheDocument();
    expect(screen.getByText("Automated Customer Journeys")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Performance Analytics")).toBeInTheDocument();
    expect(screen.getByText("Instant Checkout on WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Built-In Security & Trust")).toBeInTheDocument();
  });

  it("clicking the hero CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });

  it("clicking the onboarding CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-engage-onboarding-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });

  it("renders the hero secondary CTA as a present, clickable no-op", () => {
    render(<FastrrEngagePage />);
    useFastrrEngagePanelStore.getState().close();
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-secondary-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("clicking the revenue opportunity card's CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-revenue-opportunity-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });
});
