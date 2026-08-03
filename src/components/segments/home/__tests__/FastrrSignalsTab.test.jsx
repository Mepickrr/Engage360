import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrSignalsTab from "../FastrrSignalsTab";

describe("FastrrSignalsTab", () => {
  test("defaults to Acquisition segments showing 3 of 4 with a Show more link", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    expect(screen.getByText("Hot Leads")).toBeInTheDocument();
    expect(screen.getByText("Warm Leads")).toBeInTheDocument();
    expect(screen.getByText("Cold Leads")).toBeInTheDocument();
    expect(screen.queryByText("Nurture Leads")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 3 out of 4 results")).toBeInTheDocument();
  });

  test("switching to Acquisition shows 3 of 4 with a Show more link that reveals the 4th", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-acquisition"));
    expect(screen.getByText("Hot Leads")).toBeInTheDocument();
    expect(screen.getByText("Warm Leads")).toBeInTheDocument();
    expect(screen.getByText("Cold Leads")).toBeInTheDocument();
    expect(screen.queryByText("Nurture Leads")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 3 out of 4 results")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show more"));
    expect(screen.getByText("Nurture Leads")).toBeInTheDocument();
  });

  test("switching to Segment library shows the library info banner and cards", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-library"));
    expect(screen.getByText("promising Customer")).toBeInTheDocument();
  });

  test("switching to Fastrr Signals (formerly Shiprocket Signals) shows all 3 cards with no Show more", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-shiprocket"));
    expect(screen.getByText("Low RTO- Loyal Customers")).toBeInTheDocument();
    expect(screen.getByText("High AOV- Promising")).toBeInTheDocument();
    expect(screen.getByText("High AOV & Low RTO- New Customers")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 out of 3 results")).toBeInTheDocument();
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  test("Fastrr Signals sub-tab is labeled with a New badge", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    const tab = screen.getByTestId("fastrr-toggle-shiprocket");
    expect(tab).toHaveTextContent("Fastrr Signals");
    expect(tab).toHaveTextContent("New");
  });

  test("search filters cards by name within the active sub-tab", () => {
    render(<FastrrSignalsTab searchQuery="hot" />);
    expect(screen.getByText("Hot Leads")).toBeInTheDocument();
    expect(screen.queryByText("Warm Leads")).not.toBeInTheDocument();
  });

  test("does not render BIK or Avimee anywhere", () => {
    const { container } = render(<FastrrSignalsTab searchQuery="" />);
    expect(container.textContent).not.toMatch(/BIK/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
