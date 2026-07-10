import React from "react";
import { render, screen } from "@testing-library/react";
import InAppPreview from "../InAppPreview";

describe("InAppPreview", () => {
  it("renders real heading/text/button block content, not a placeholder glyph", () => {
    render(
      <InAppPreview
        draft={{
          displayType: "popup",
          blocks: [
            { type: "heading", content: "Still thinking it over?" },
            { type: "text", content: "Complete your order and save." },
            { type: "button", label: "Complete My Order" },
          ],
        }}
      />
    );
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
    expect(screen.getByText("Complete your order and save.")).toBeInTheDocument();
    expect(screen.getByText("Complete My Order")).toBeInTheDocument();
  });

  it("shows an empty state when there are no blocks", () => {
    render(<InAppPreview draft={{ displayType: "popup", blocks: [] }} />);
    expect(screen.getByText("No content blocks yet")).toBeInTheDocument();
  });
});
