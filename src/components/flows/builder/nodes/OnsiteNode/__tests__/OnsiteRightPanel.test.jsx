import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import OnsiteRightPanel from "../OnsiteRightPanel";
import { defaultOnsiteNodeData } from "../data/mockData";

function StatefulHarness({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));
  return <OnsiteRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />;
}

describe("OnsiteRightPanel — Template tab", () => {
  it("opens the template browse modal directly on the same click that picks a Display Type", () => {
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a popup template/i.test(el.textContent);
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Popup"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("shows hover Edit/Analytics/Select actions on a template card in the modal", () => {
    render(<StatefulHarness initialData={{ ...defaultOnsiteNodeData }} />);
    fireEvent.click(screen.getByText("Popup"));
    const card = screen.getByText("Cart Recovery Popup").closest("div[style*='position: relative']");
    fireEvent.mouseEnter(card);
    expect(within(card).getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /analytics/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /select/i })).toBeInTheDocument();
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
