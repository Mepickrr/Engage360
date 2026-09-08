import React from "react";
import { render, screen } from "@testing-library/react";
import IdentificationFunnelSection from "../IdentificationFunnelSection";

const FIXTURE = {
  stages: [
    { key: "totalSessions", label: "Total Sessions", count: 100000 },
    { key: "identifiedSessions", label: "Identified Sessions", count: 26000 },
    { key: "checkoutInitiated", label: "Checkout Initiated", count: 10000 },
    { key: "checkoutSso", label: "Checkout (Smart Card / SSO)", count: 6800 },
    { key: "orderPlaced", label: "Order Placed", count: 4800 },
  ],
  dropoffByPage: [
    { page: "Homepage", count: 7000 }, { page: "PDP", count: 4600 }, { page: "Cart", count: 2400 }, { page: "Checkout", count: 1600 },
  ],
};

describe("IdentificationFunnelSection", () => {
  test("shows skeleton while loading", () => {
    render(<IdentificationFunnelSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-funnel-skeleton")).toBeInTheDocument();
  });

  test("renders the connected funnel and drop-off chart", () => {
    render(<IdentificationFunnelSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-funnel-chart")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-funnel-dropoff")).toBeInTheDocument();
  });
});
