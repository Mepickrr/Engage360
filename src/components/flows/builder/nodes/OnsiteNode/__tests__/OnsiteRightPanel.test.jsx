import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import OnsiteRightPanel from "../OnsiteRightPanel";
import { defaultOnsiteNodeData } from "../data/mockData";

function StatefulHarness({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));
  return <OnsiteRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />;
}

describe("OnsiteRightPanel — template step", () => {
  it("opens the template library and applies a template as-is", () => {
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    fireEvent.click(screen.getByText("Browse template library"));
    const card = screen.getByTestId("onsite-template-lib_cart_recovery");
    fireEvent.mouseEnter(card);
    fireEvent.click(within(card).getByRole("button", { name: /use as is/i }));
    expect(screen.queryByRole("dialog", { name: /template library/i })).not.toBeInTheDocument();
    expect(screen.getByText("Popup: Cart Recovery")).toBeInTheDocument();
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
  });

  it("filters the library by display type", () => {
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    fireEvent.click(screen.getByText("Browse template library"));
    fireEvent.click(screen.getByLabelText(/^Banner \(/));
    expect(screen.getByText("Banner: Free Shipping Bar")).toBeInTheDocument();
    expect(screen.queryByText("Popup: Cart Recovery")).not.toBeInTheDocument();
  });

  it("offers blank Popup, Banner and Nudge templates under Start from scratch, opening the editor", () => {
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    fireEvent.click(screen.getByText("Start from scratch"));
    expect(screen.getByText("Blank Popup Template")).toBeInTheDocument();
    expect(screen.getByText("Blank Banner Template")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Blank Nudge Template"));
    expect(screen.getByText("Visual Editor", { exact: false })).toBeInTheDocument();
  });

  it("turns on Smart Pop-up when a template with a smart form is used", () => {
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    fireEvent.click(screen.getByText("Browse template library"));
    const card = screen.getByTestId("onsite-template-lib_smart_lead");
    fireEvent.mouseEnter(card);
    fireEvent.click(within(card).getByRole("button", { name: /use as is/i }));
    expect(screen.getByRole("checkbox", { name: /prefill shopper details/i })).toBeChecked();
  });

  it("shows the real selected template content (not just a display-type emoji) in the right panel's preview card", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultOnsiteNodeData,
          displayType: "popup",
          template: { id: "osm_001", name: "Cart Recovery Popup", useCase: "Promotions & Sales", status: "Active", displayType: "popup", blocks: [{ type: "title", content: "Still thinking it over?" }] },
        }}
      />
    );
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
  });

  it("delegates Edit to the full-screen block editor instead of the browse modal's own form", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultOnsiteNodeData,
          displayType: "popup",
          template: { id: "osm_001", name: "Cart Recovery Popup", useCase: "Promotions & Sales", status: "Active", displayType: "popup", blocks: [{ type: "title", content: "Still thinking it over?" }] },
        }}
      />
    );
    fireEvent.click(screen.getByText("Edit Template"));
    expect(screen.getByText("Visual Editor", { exact: false })).toBeInTheDocument();
  });
});
