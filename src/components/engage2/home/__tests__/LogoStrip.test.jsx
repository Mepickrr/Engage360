import React from "react";
import { render, screen } from "@testing-library/react";
import LogoStrip from "../LogoStrip";

const BRANDS = [
  "Lumora",
  "Verve & Co.",
  "Northline",
  "Aurelia Home",
  "Kindred Goods",
  "Solstice Apparel",
];

describe("LogoStrip", () => {
  it("renders the eyebrow, the Shiprocket trust line, and all 6 fictional brand wordmarks", () => {
    render(<LogoStrip />);
    expect(screen.getByTestId("fastrr-engage-logo-strip")).toBeInTheDocument();
    expect(screen.getByText("Trusted by growing D2C brands")).toBeInTheDocument();
    expect(
      screen.getByText("Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers")
    ).toBeInTheDocument();
    BRANDS.forEach((brand) => {
      expect(screen.getByText(brand)).toBeInTheDocument();
    });
  });
});
