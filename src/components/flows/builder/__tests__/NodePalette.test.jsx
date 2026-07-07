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

  it("does not render the old Google Sheets category or its Add Row/Update Row/Get Row Data items", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.queryByText("Google Sheets")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Row")).not.toBeInTheDocument();
    expect(screen.queryByText("Update Row")).not.toBeInTheDocument();
    expect(screen.queryByText("Get Row Data")).not.toBeInTheDocument();
  });

  it("renders a single Google Sheet entry under Integrations", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.getByText("Google Sheet")).toBeInTheDocument();
  });
});
