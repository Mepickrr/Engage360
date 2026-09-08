import React from "react";
import { render, screen } from "@testing-library/react";
import SourceBreakdownSection from "../SourceBreakdownSection";

const FIXTURE = {
  sources: [
    { source: "Smart Card", pct: 34 }, { source: "Checkout", pct: 27 }, { source: "Pop-up", pct: 18 }, { source: "Cookie", pct: 12 }, { source: "Signup", pct: 9 },
  ],
  deviceSplit: [{ device: "Web (Desktop)", pct: 38 }, { device: "Web (Mobile)", pct: 44 }, { device: "App", pct: 18 }],
};

describe("SourceBreakdownSection", () => {
  test("shows skeleton while loading", () => {
    render(<SourceBreakdownSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-source-skeleton")).toBeInTheDocument();
  });

  test("renders the source breakdown and device split", () => {
    render(<SourceBreakdownSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-source-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-device-split")).toBeInTheDocument();
  });
});
