import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ComparisonLineChart from "../ComparisonLineChart";

const data = [
  { date: "28 Jul", overall: 0, fastrr: 10000 },
  { date: "29 Jul", overall: 3000000, fastrr: 155000 },
];

describe("ComparisonLineChart", () => {
  test("renders with the given series labels", async () => {
    render(
      <div style={{ width: "500px", height: "400px" }}>
        <ComparisonLineChart
          testId="trend-revenue"
          data={data}
          seriesLabels={{ overall: "Overall Revenue", fastrr: "Fastrr Revenue" }}
          valueFormatter={(n) => `₹${n}`}
        />
      </div>
    );
    const chart = screen.getByTestId("trend-revenue");
    await waitFor(() => {
      expect(chart).toHaveTextContent("Overall Revenue");
    });
    expect(chart).toHaveTextContent("Fastrr Revenue");
  });
});
