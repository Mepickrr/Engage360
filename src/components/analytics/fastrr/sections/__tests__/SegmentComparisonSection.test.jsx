import React from "react";
import { render, screen } from "@testing-library/react";
import SegmentComparisonSection from "../SegmentComparisonSection";

const FIXTURE = {
  segments: [
    { key: "known", label: "Known", orders: 9000, revenue: 8000000, aov: 900, repeatRate: 40, engagementRate: 62 },
    { key: "fastrrIdentified", label: "Fastrr-Identified", orders: 4000, revenue: 3600000, aov: 900, repeatRate: 31, engagementRate: 55 },
    { key: "anonymous", label: "Anonymous", orders: 1200, revenue: 1000000, aov: 830, repeatRate: 7, engagementRate: 12 },
  ],
  growthTrend: [{ period: "Wk 1", conversionRate: 4 }, { period: "Wk 2", conversionRate: 4.8 }],
  topIdentifiedUsers: [{ id: "u1", name: "Ritika Desai", identifiedOn: "01 Sep 2026", ltv: 24000 }],
  repeatCohort: [{ week: "W0", fastrrIdentified: 22, known: 30 }, { week: "W1", fastrrIdentified: 18, known: 26 }],
};

describe("SegmentComparisonSection", () => {
  test("shows skeleton while loading", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-segments-skeleton")).toBeInTheDocument();
  });

  test("each segment card shows rates before raw counts", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    const card = screen.getByTestId("fastrr-segment-known");
    const rateIndex = card.innerHTML.indexOf("fastrr-segment-known-repeat-rate");
    const countIndex = card.innerHTML.indexOf("Orders:");
    expect(rateIndex).toBeGreaterThan(-1);
    expect(rateIndex).toBeLessThan(countIndex);
  });

  test("renders the Top Identified Users extra with a disabled stub link", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-top-identified-users")).toHaveTextContent("Ritika Desai");
    expect(screen.getByTestId("fastrr-top-identified-user-u1-view-in-audience")).toBeDisabled();
  });

  test("renders the repeat-purchase cohort curve extra", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-repeat-cohort")).toBeInTheDocument();
  });
});
