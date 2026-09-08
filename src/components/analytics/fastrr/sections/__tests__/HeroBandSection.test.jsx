import React from "react";
import { render, screen, within } from "@testing-library/react";
import HeroBandSection from "../HeroBandSection";

function fixture(overrides = {}) {
  return {
    totalSessions: { value: 100000, deltaPct: 8, deltaAbs: 8000 },
    identifiedSessions: { value: 26300, deltaPct: 9, deltaAbs: 2200 },
    identificationRate: { value: 26.3, deltaPct: 2, deltaAbs: 0 },
    benchmark: { yourStore: 26.3, allFastrrStores: 19.2, categoryAvg: 17.3 },
    gmv: { lastClick: 3000000, firstClick: 3900000 },
    freshness: { intervalMinutes: 15, lastRefreshed: "2026-09-08T06:00:00.000Z" },
    ...overrides,
  };
}

describe("HeroBandSection", () => {
  test("shows the loading skeleton when isLoading", () => {
    render(<HeroBandSection data={fixture()} compare isLoading />);
    expect(screen.getByTestId("fastrr-hero-skeleton")).toBeInTheDocument();
  });

  test("shows the benchmark callout when ahead of both comparisons", () => {
    render(<HeroBandSection data={fixture()} compare isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-benchmark-callout")).toHaveTextContent(
      "You're identifying 7.1 pts more traffic than the average Fastrr store."
    );
  });

  test("hides the benchmark callout when behind either comparison", () => {
    const data = fixture({ benchmark: { yourStore: 15.0, allFastrrStores: 19.2, categoryAvg: 17.3 } });
    render(<HeroBandSection data={data} compare isLoading={false} />);
    expect(screen.queryByTestId("fastrr-hero-benchmark-callout")).not.toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-benchmark")).toHaveTextContent("Your Store: 15.0%");
  });

  test("hides delta chips when compare is off", () => {
    render(<HeroBandSection data={fixture()} compare={false} isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-total-sessions")).not.toHaveTextContent("vs last period");
  });

  test("shows GMV as a Last-Click / First-Click pair, never a toggle", () => {
    render(<HeroBandSection data={fixture()} compare isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-gmv-pair")).toHaveTextContent("Last-Click");
    expect(screen.getByTestId("fastrr-hero-gmv-pair")).toHaveTextContent("First-Click/Open");
  });

  test("renders a MetricTooltip next to the Identification Rate label", () => {
    render(<HeroBandSection data={fixture()} compare isLoading={false} />);
    const card = screen.getByTestId("fastrr-hero-identification-rate");
    expect(within(card).getByTestId("metric-tooltip-trigger")).toBeInTheDocument();
  });
});
