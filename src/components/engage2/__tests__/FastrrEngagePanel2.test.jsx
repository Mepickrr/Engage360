import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePanel from "../FastrrEngagePanel2";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

describe("FastrrEngagePanel", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
  });

  it("renders nothing when closed", () => {
    render(<FastrrEngagePanel />);
    expect(screen.queryByTestId("fastrr-engage-panel")).not.toBeInTheDocument();
  });

  it("renders the pitch content when open", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    expect(screen.getByTestId("fastrr-engage-panel")).toBeInTheDocument();
    expect(screen.getByText("Fastrr Journey")).toBeInTheDocument();
    expect(screen.getByText("Powered by Fastrr Engage")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-revenue-opportunity")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-stat-grid")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-journey-list")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Product")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Checkout")).toBeInTheDocument();
  });

  it("revenue opportunity card's CTA is a clickable no-op that doesn't close the panel", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByTestId("fastrr-revenue-opportunity-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("closing via the Sheet's close control updates the store", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
  });

  it("CTA buttons render and are clickable no-ops", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-secondary-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("clicking the hero primary CTA closes the panel and navigates to account setup", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-primary-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
  });

  it("clicking the footer CTA closes the panel and navigates to account setup", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByTestId("fastrr-engage-footer-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
  });
});
