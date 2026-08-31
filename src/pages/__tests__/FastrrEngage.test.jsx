import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

describe("FastrrEngagePage", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
  });

  it("opens the panel automatically on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("renders the page title and reopen button", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-view-journey-btn")).toBeInTheDocument();
  });

  it("clicking 'View Fastrr Journey' opens the panel", () => {
    render(<FastrrEngagePage />);
    useFastrrEngagePanelStore.getState().close();
    fireEvent.click(screen.getByTestId("fastrr-engage-view-journey-btn"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });
});
