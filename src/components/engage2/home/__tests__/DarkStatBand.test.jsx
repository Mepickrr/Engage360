import React from "react";
import { render, screen } from "@testing-library/react";
import DarkStatBand from "../DarkStatBand";

describe("DarkStatBand", () => {
  it("renders the eyebrow and all 4 stat values with labels", () => {
    render(<DarkStatBand />);
    expect(screen.getByTestId("fastrr-engage-stats-bar")).toBeInTheDocument();
    expect(screen.getByText("The Numbers Behind Fastrr Journey")).toBeInTheDocument();
    expect(screen.getByText("20%+")).toBeInTheDocument();
    expect(screen.getByText("Abandoned cart recovery")).toBeInTheDocument();
    expect(screen.getByText("25%+")).toBeInTheDocument();
    expect(screen.getByText("Contribution to revenue")).toBeInTheDocument();
    expect(screen.getByText("20X+")).toBeInTheDocument();
    expect(screen.getByText("ROAS")).toBeInTheDocument();
    expect(screen.getByText("2B+")).toBeInTheDocument();
    expect(screen.getByText("Conversations delivered")).toBeInTheDocument();
  });
});
