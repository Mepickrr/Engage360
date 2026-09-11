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

  it("renders the page wrapper and all seven sections", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(
      screen.getByText("Convert Every Anonymous Visitor Into a Paying Customer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-logo-strip")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-revenue-opportunity")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-feature-grid")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-onboarding-cta")).toBeInTheDocument();
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

  it("clicking the revenue opportunity card's CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-revenue-opportunity-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });
});
