import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrSignalsTab from "../FastrrSignalsTab";

describe("FastrrSignalsTab", () => {
  test("defaults to Retention segments showing all 10 with no Show more", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText("Lost customers")).toBeInTheDocument();
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
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

  test("search filters cards by name within the active sub-tab", () => {
    render(<FastrrSignalsTab searchQuery="champ" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Loyal customers")).not.toBeInTheDocument();
  });

  test("does not render BIK or Avimee anywhere", () => {
    const { container } = render(<FastrrSignalsTab searchQuery="" />);
    expect(container.textContent).not.toMatch(/BIK/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
