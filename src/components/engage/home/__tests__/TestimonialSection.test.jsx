import React from "react";
import { render, screen } from "@testing-library/react";
import TestimonialSection from "../TestimonialSection";

describe("TestimonialSection", () => {
  it("renders the heading and all 3 testimonial cards with attribution", () => {
    render(<TestimonialSection />);
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
    expect(screen.getByText("Loved by Growing D2C Brands")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-ananya-rao")).toBeInTheDocument();
    expect(
      screen.getByText(/We recovered 22% of abandoned carts/)
    ).toBeInTheDocument();
    expect(screen.getByText("Ananya Rao")).toBeInTheDocument();
    expect(screen.getByText("Growth Lead, Lumora")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-rohit-malhotra")).toBeInTheDocument();
    expect(screen.getByText("Rohit Malhotra")).toBeInTheDocument();
    expect(screen.getByText("Founder, Northline")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-priya-nair")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.getByText("D2C Manager, Aurelia Home")).toBeInTheDocument();
  });
});
