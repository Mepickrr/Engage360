import React from "react";
import { render, screen } from "@testing-library/react";
import GroupedBarChart from "../GroupedBarChart";

describe("GroupedBarChart", () => {
  test("renders with a title and testid for a multi-series dataset", () => {
    render(
      <GroupedBarChart
        testId="chart"
        title="Engagement by channel"
        data={[{ label: "WhatsApp", sent: 100, delivered: 90 }, { label: "Email", sent: 50, delivered: 40 }]}
        xKey="label"
        series={[{ key: "sent", label: "Sent" }, { key: "delivered", label: "Delivered" }]}
        valueFormatter={(v) => String(v)}
      />
    );
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toHaveTextContent("Engagement by channel");
  });
});
