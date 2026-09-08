import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TrendsSection from "../TrendsSection";

function series(base) {
  return {
    day: [{ period: "01 Sep", value: base, sent: base, delivered: base, read: base, clicked: base, orders: base, revenue: base }],
    week: [{ period: "Wk 27", value: base + 5, sent: base + 5, delivered: base + 5, read: base + 5, clicked: base + 5, orders: base + 5, revenue: base + 5 }],
    deltaPct: 8,
  };
}

const FIXTURE = {
  identificationRate: series(20),
  messagingFunnel: series(9000),
  ordersRevenue: series(300),
  repeatOrders: series(400),
};

const CHART_IDS = ["fastrr-trend-identification-rate", "fastrr-trend-messaging-funnel", "fastrr-trend-orders-revenue", "fastrr-trend-repeat-orders"];

describe("TrendsSection", () => {
  test("shows skeleton while loading", () => {
    render(<TrendsSection data={FIXTURE} compare isLoading />);
    expect(screen.getByTestId("fastrr-trends-skeleton")).toBeInTheDocument();
  });

  test("renders all 4 charts in a 2x2 grid with a %-change chip each", () => {
    render(<TrendsSection data={FIXTURE} compare isLoading={false} />);
    CHART_IDS.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
      expect(screen.getByTestId(`${id}-delta-chip`)).toHaveTextContent("8%");
    });
  });

  test("granularity toggle switches the active button per chart", () => {
    render(<TrendsSection data={FIXTURE} compare isLoading={false} />);
    const dayBtn = screen.getByTestId("fastrr-trend-identification-rate-granularity-day");
    const weekBtn = screen.getByTestId("fastrr-trend-identification-rate-granularity-week");
    expect(dayBtn).toHaveClass("bg-primary");
    fireEvent.click(weekBtn);
    expect(weekBtn).toHaveClass("bg-primary");
    expect(dayBtn).not.toHaveClass("bg-primary");
  });

  test("hides delta chips on all 4 charts when compare is false, shows them when compare is true", () => {
    const { rerender } = render(<TrendsSection data={FIXTURE} compare={false} isLoading={false} />);
    CHART_IDS.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
      expect(screen.queryByTestId(`${id}-delta-chip`)).not.toBeInTheDocument();
    });

    rerender(<TrendsSection data={FIXTURE} compare={true} isLoading={false} />);
    CHART_IDS.forEach((id) => {
      expect(screen.getByTestId(`${id}-delta-chip`)).toHaveTextContent("8%");
    });
  });
});
