import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversionRoiSection from "../ConversionRoiSection";

const FIXTURE = {
  isEmpty: false,
  byChannel: [
    { label: "WhatsApp", orders: 900, revenue: 810000, aov: 900, roi: 10.5 },
    { label: "Email", orders: 300, revenue: 240000, aov: 800, roi: 6.2 },
  ],
  roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated).",
  attribution: { lastClick: 3200000, firstClick: 4100000 },
  topJourneys: Array.from({ length: 12 }, (_, i) => ({
    id: `journey-${i + 1}`, name: `Journey ${i + 1}`, channels: ["WhatsApp"], triggerEvent: "Cart Abandon",
    sent: 1000 + i, delivered: 900 + i, orders: 20 + i, revenue: (20 + i) * 900, roi: 5 + i * 0.1, aov: 900, uniqueCustomers: 18 + i,
  })),
  triggerSplit: [{ trigger: "Product View", revenue: 800000 }],
};

describe("ConversionRoiSection", () => {
  test("shows skeleton while loading", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-conversion-skeleton")).toBeInTheDocument();
  });

  test("shows the ROI formula visibly, not only on hover", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-roi-formula")).toHaveTextContent("ROI = (Revenue − Cost) / Cost × 100");
  });

  test("wires MetricTooltip next to the ROI formula", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    const formula = screen.getByTestId("fastrr-conversion-roi-formula");
    const tooltipTrigger = screen.getByTestId("metric-tooltip-trigger");
    expect(formula.parentElement).toContainElement(tooltipTrigger);
  });

  test("caps the top journeys table at 10 rows and it is sortable", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getAllByTestId(/^fastrr-top-journeys-table-row-/)).toHaveLength(10);
    fireEvent.click(screen.getByTestId("fastrr-top-journeys-table-sort-orders"));
    expect(screen.getAllByTestId(/^fastrr-top-journeys-table-row-/)[0]).toHaveTextContent("Journey 12");
  });

  test("shows attribution as Last-Click/First-Click, never a toggle", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-attribution")).toHaveTextContent("Last-Click");
    expect(screen.getByTestId("fastrr-conversion-attribution")).toHaveTextContent("First-Click/Open");
  });

  test("shows the empty state when data.isEmpty", () => {
    render(<ConversionRoiSection data={{ ...FIXTURE, isEmpty: true }} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-empty")).toBeInTheDocument();
  });
});
