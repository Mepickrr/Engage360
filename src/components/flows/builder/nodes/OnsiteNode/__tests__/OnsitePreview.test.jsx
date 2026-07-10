import React from "react";
import { render, screen } from "@testing-library/react";
import OnsitePreview from "../OnsitePreview";

describe("OnsitePreview", () => {
  it("renders real title/text/button block content, not a placeholder glyph", () => {
    render(
      <OnsitePreview
        draft={{
          displayType: "popup",
          blocks: [
            { type: "title", content: "Still thinking it over?" },
            { type: "text", content: "Your cart is waiting." },
            { type: "button", label: "Complete My Order" },
          ],
        }}
      />
    );
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
    expect(screen.getByText("Your cart is waiting.")).toBeInTheDocument();
    expect(screen.getByText("Complete My Order")).toBeInTheDocument();
  });

  it("shows an empty state when there are no blocks, rather than cropping to nothing", () => {
    render(<OnsitePreview draft={{ displayType: "popup", blocks: [] }} />);
    expect(screen.getByText("No content blocks yet")).toBeInTheDocument();
  });

  it("renders a banner shape without a dark overlay scrim (unlike popup/nudge)", () => {
    const { container } = render(
      <OnsitePreview draft={{ displayType: "banner", blocks: [{ type: "text", content: "Flash sale!" }] }} />
    );
    expect(screen.getByText("Flash sale!")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("rgba(0,0,0,0.25)");
  });
});
