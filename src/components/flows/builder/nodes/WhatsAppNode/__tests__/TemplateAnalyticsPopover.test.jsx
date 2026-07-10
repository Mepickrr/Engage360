import React from "react";
import { render, screen } from "@testing-library/react";
import TemplateAnalyticsPopover from "../TemplateAnalyticsPopover";

const ANCHOR_RECT = { left: 100, top: 100, right: 200, bottom: 150, width: 100, height: 50 };

describe("TemplateAnalyticsPopover", () => {
  it("shows the default WhatsApp metrics (Sent/Delivered/Read/CTR) when no overrides are passed", () => {
    render(<TemplateAnalyticsPopover anchorRect={ANCHOR_RECT} template={{ id: "wa_1" }} onClose={() => {}} />);
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("CTR")).toBeInTheDocument();
  });

  it("renders a custom metrics list and getAnalytics function when provided", () => {
    const getAnalytics = () => ({ sent: 42, delivered: 40, deliveredPct: 95, failed: 2, failedPct: 5 });
    const metrics = [
      { label: "Sent", value: (d) => String(d.sent) },
      { label: "Delivered", value: (d) => `${d.delivered} · ${d.deliveredPct}%` },
      { label: "Failed", value: (d) => `${d.failed} · ${d.failedPct}%` },
    ];
    render(
      <TemplateAnalyticsPopover
        anchorRect={ANCHOR_RECT}
        template={{ id: "sms_1" }}
        onClose={() => {}}
        getAnalytics={getAnalytics}
        metrics={metrics}
      />
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.queryByText("Read")).not.toBeInTheDocument();
    expect(screen.queryByText("CTR")).not.toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
