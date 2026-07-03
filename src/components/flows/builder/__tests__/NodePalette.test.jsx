import React from "react";
import { render, screen } from "@testing-library/react";
import NodePalette from "../NodePalette";

describe("NodePalette — sticky note removal", () => {
  it("does not render a Notes category or Sticky Notes item", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Sticky Notes")).not.toBeInTheDocument();
  });

  it("still renders other categories, e.g. Communication", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.getByText("Communication")).toBeInTheDocument();
  });
});
