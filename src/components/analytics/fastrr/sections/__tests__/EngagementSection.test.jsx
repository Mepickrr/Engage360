import React from "react";
import { render, screen, within } from "@testing-library/react";
import EngagementSection from "../EngagementSection";

const FIXTURE = {
  isEmpty: false,
  funnel: { sent: 90000, delivered: 84000, read: 42000, clicked: 9000 },
  readRate: 50,
  clickRate: 10.7,
  byChannel: [
    { label: "WhatsApp", sent: 40000, delivered: 38000, read: 20000, clicked: 5000 },
    { label: "Email", sent: 20000, delivered: 19000, read: 6000, clicked: 900 },
  ],
  aiCalling: { callsPlaced: 6000, callsConnected: 3700, callsCompleted: 3000, actionTaken: 1300 },
};

describe("EngagementSection", () => {
  test("shows skeleton while loading", () => {
    render(<EngagementSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-engagement-skeleton")).toBeInTheDocument();
  });

  test("AI Calling never appears in the channel-wise grouped bar", () => {
    render(<EngagementSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-engagement-by-channel")).not.toHaveTextContent("AI Calling");
    expect(screen.getByTestId("fastrr-engagement-ai-calling")).toHaveTextContent("Calls Placed");
  });

  test("shows the empty state instead of charts when data.isEmpty", () => {
    render(<EngagementSection data={{ ...FIXTURE, isEmpty: true }} isLoading={false} />);
    expect(screen.getByTestId("fastrr-engagement-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("fastrr-engagement-by-channel")).not.toBeInTheDocument();
  });

  test("summary row includes MetricTooltip hover-formula triggers for Read Rate and Click Rate", () => {
    render(<EngagementSection data={FIXTURE} isLoading={false} />);
    const summary = screen.getByTestId("fastrr-engagement-summary");
    const triggers = within(summary).getAllByTestId("metric-tooltip-trigger");
    expect(triggers).toHaveLength(2);
  });

  test("skips the channel chart (not isEmpty) when byChannel is empty, but still shows the AI Calling funnel card", () => {
    render(<EngagementSection data={{ ...FIXTURE, byChannel: [] }} isLoading={false} />);
    expect(screen.queryByTestId("fastrr-engagement-empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fastrr-engagement-by-channel")).not.toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engagement-ai-calling")).toHaveTextContent("Calls Placed");
    expect(screen.getByTestId("fastrr-engagement-summary")).toBeInTheDocument();
  });
});
