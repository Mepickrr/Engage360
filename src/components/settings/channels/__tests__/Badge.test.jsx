import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "../Badge";

describe("Badge", () => {
  it("renders its children with a tone-specific class", () => {
    render(<Badge tone="emerald">Default for Campaigns</Badge>);
    const badge = screen.getByText("Default for Campaigns");
    expect(badge).toHaveClass("bg-emerald-50");
  });

  it("defaults to the slate tone", () => {
    render(<Badge>Plain</Badge>);
    expect(screen.getByText("Plain")).toHaveClass("bg-slate-100");
  });
});
