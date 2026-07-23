import React from "react";
import { render, screen } from "@testing-library/react";
import SuppressionAssetsTab from "../SuppressionAssetsTab";

describe("SuppressionAssetsTab", () => {
  test("renders both suppression cards with Fastrr branding and no Show more", () => {
    render(<SuppressionAssetsTab searchQuery="" />);
    expect(screen.getByText("Email suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.getByText("Showing all 2 results")).toBeInTheDocument();
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });

  test("search filters the two cards", () => {
    render(<SuppressionAssetsTab searchQuery="whatsapp" />);
    expect(screen.getByText("WhatsApp suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.queryByText("Email suppressed by Fastrr")).not.toBeInTheDocument();
  });
});
