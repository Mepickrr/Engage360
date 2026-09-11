import React from "react";
import { render, screen } from "@testing-library/react";
import BentoFeatureGrid from "../BentoFeatureGrid";

describe("BentoFeatureGrid", () => {
  it("renders the tagline, all 6 features, and exactly 2 wide tiles", () => {
    render(<BentoFeatureGrid />);
    expect(screen.getByTestId("bento-tagline-heading")).toHaveTextContent(
      "Identify | Engage | Grow"
    );
    expect(screen.getByTestId("fastrr-engage-feature-grid")).toBeInTheDocument();
    expect(screen.getByText("Identify Anonymous Shoppers")).toBeInTheDocument();
    expect(screen.getByText("Conversational Commerce")).toBeInTheDocument();
    expect(screen.getByText("Automated Customer Journeys")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Performance Analytics")).toBeInTheDocument();
    expect(screen.getByText("Instant Checkout on WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Built-In Security & Trust")).toBeInTheDocument();
    expect(screen.getAllByTestId("feature-tile-wide")).toHaveLength(2);
    expect(screen.getAllByTestId("feature-tile")).toHaveLength(4);
  });
});
