import React from "react";
import { render, screen } from "@testing-library/react";
import FunnelChart from "../FunnelChart";

describe("FunnelChart", () => {
  test("renders one row per stage with its count", () => {
    render(
      <FunnelChart
        testId="funnel"
        stages={[
          { key: "a", label: "Total Sessions", count: 1000 },
          { key: "b", label: "Identified Sessions", count: 250 },
        ]}
      />
    );
    expect(screen.getByTestId("funnel-stage-a")).toHaveTextContent("Total Sessions");
    expect(screen.getByTestId("funnel-stage-b")).toHaveTextContent("Identified Sessions");
    expect(screen.getByTestId("funnel-stage-b")).toHaveTextContent("25.0%");
  });
});
