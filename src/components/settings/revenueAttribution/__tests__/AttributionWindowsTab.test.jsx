import React from "react";
import { render, screen, within } from "@testing-library/react";
import AttributionWindowsTab from "../AttributionWindowsTab";

describe("AttributionWindowsTab", () => {
  test("renders attribution cards for Campaigns and Journeys only", () => {
    render(<AttributionWindowsTab />);
    expect(screen.getByTestId("revenue-attribution-card-campaigns")).toBeInTheDocument();
    expect(screen.getByTestId("revenue-attribution-card-journeys")).toBeInTheDocument();
  });

  test("does not render Helpdesk or AI agents attribution cards", () => {
    render(<AttributionWindowsTab />);
    expect(screen.queryByTestId("revenue-attribution-card-helpdesk")).not.toBeInTheDocument();
    expect(screen.queryByTestId("revenue-attribution-card-aiAgents")).not.toBeInTheDocument();
    expect(screen.queryByText("Helpdesk")).not.toBeInTheDocument();
    expect(screen.queryByText("AI agents")).not.toBeInTheDocument();
  });

  test("offers First Click, Last Click, Open, and Delivered as attribution type options (Click hidden), defaulting to First Click", () => {
    render(<AttributionWindowsTab />);
    const select = screen.getByTestId("revenue-attribution-campaigns-type");
    const optionLabels = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(optionLabels).toEqual(["First Click", "Last Click", "Open", "Delivered"]);
    expect(select).toHaveValue("First Click");
  });

  test("shows a footer bullet explaining each remaining attribution type, and hides the Click bullet", () => {
    render(<AttributionWindowsTab />);
    expect(screen.queryByText("Click:")).not.toBeInTheDocument();
    expect(screen.getByText("First Click:")).toBeInTheDocument();
    expect(screen.getByText("Last Click:")).toBeInTheDocument();
    expect(screen.getByText("Open:")).toBeInTheDocument();
    expect(screen.getByText("Delivered:")).toBeInTheDocument();
  });
});
