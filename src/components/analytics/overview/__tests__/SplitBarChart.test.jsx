import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SplitBarChart from "../SplitBarChart";

const byService = [
  { label: "Broadcast", value: 2060000 },
  { label: "Journey", value: 1545000 },
];
const byChannel = [
  { label: "WhatsApp", value: 3350000 },
  { label: "SMS", value: 120000 },
];

describe("SplitBarChart", () => {
  test("renders title and defaults to the Service view", async () => {
    render(
      <div style={{ width: "500px", height: "400px" }}>
        <SplitBarChart
          testId="split-revenue"
          title="Fastrr Revenue split by"
          byService={byService}
          byChannel={byChannel}
          valueFormatter={(n) => `₹${n}`}
        />
      </div>
    );
    const chart = screen.getByTestId("split-revenue");
    expect(chart).toHaveTextContent("Fastrr Revenue split by");
    await waitFor(() => {
      expect(chart).toHaveTextContent("Broadcast");
    });
    expect(chart).not.toHaveTextContent("WhatsApp");
  });

  test("toggling to Channel swaps the dataset shown", async () => {
    render(
      <div style={{ width: "500px", height: "400px" }}>
        <SplitBarChart
          testId="split-revenue"
          title="Fastrr Revenue split by"
          byService={byService}
          byChannel={byChannel}
          valueFormatter={(n) => `₹${n}`}
        />
      </div>
    );
    fireEvent.click(screen.getByTestId("split-revenue-toggle-channel"));
    await waitFor(() => {
      expect(screen.getByTestId("split-revenue")).toHaveTextContent("WhatsApp");
    });
    expect(screen.getByTestId("split-revenue")).not.toHaveTextContent("Broadcast");
  });

  test("renders no BIK strings, uses Fastrr copy", () => {
    render(
      <div style={{ width: "500px", height: "400px" }}>
        <SplitBarChart
          testId="split-revenue"
          title="Fastrr Revenue split by"
          byService={byService}
          byChannel={byChannel}
          valueFormatter={(n) => `₹${n}`}
        />
      </div>
    );
    expect(screen.getByTestId("split-revenue").textContent).not.toMatch(/\bBIK\b/i);
  });
});
