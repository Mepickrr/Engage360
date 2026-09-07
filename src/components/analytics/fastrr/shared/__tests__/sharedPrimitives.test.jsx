import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PoweredByLabel from "../PoweredByLabel";
import MetricTooltip from "../MetricTooltip";
import AttributionPair from "../AttributionPair";
import SectionSkeleton from "../SectionSkeleton";
import SectionEmptyState from "../SectionEmptyState";

describe("PoweredByLabel", () => {
  test("renders the source name", () => {
    render(<PoweredByLabel source="Fastrr SDK" />);
    expect(screen.getByText("Powered by Fastrr SDK")).toBeInTheDocument();
  });
});

describe("MetricTooltip", () => {
  test("shows name, formula and description on hover", async () => {
    render(<MetricTooltip name="Read Rate" formula="Read ÷ Delivered × 100" description="Share of delivered messages that were opened." />);
    fireEvent.mouseOver(screen.getByTestId("metric-tooltip-trigger"));
    expect(await screen.findByText("Read Rate")).toBeInTheDocument();
    expect(await screen.findByText("Read ÷ Delivered × 100")).toBeInTheDocument();
    expect(await screen.findByText("Share of delivered messages that were opened.")).toBeInTheDocument();
  });
});

describe("AttributionPair", () => {
  test("renders both attribution numbers side by side, never as a toggle", () => {
    render(<AttributionPair testId="attr" lastClick={100} firstClick={200} formatter={(v) => `₹${v}`} />);
    const wrapper = screen.getByTestId("attr");
    expect(wrapper).toHaveTextContent("Last-Click");
    expect(wrapper).toHaveTextContent("₹100");
    expect(wrapper).toHaveTextContent("First-Click/Open");
    expect(wrapper).toHaveTextContent("₹200");
    expect(wrapper.querySelectorAll("button")).toHaveLength(0);
  });
});

describe("SectionSkeleton", () => {
  test("renders the requested number of shimmer rows", () => {
    render(<SectionSkeleton testId="skel" rows={3} />);
    expect(screen.getByTestId("skel").children).toHaveLength(3);
  });
});

describe("SectionEmptyState", () => {
  test("shows the exact empty-state copy", () => {
    render(<SectionEmptyState testId="empty" />);
    expect(screen.getByTestId("empty")).toHaveTextContent(
      "No data for this range/channel yet — try widening the date range or switching channels."
    );
  });
});
