import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import InAppRightPanel from "../InAppRightPanel";
import { defaultInAppNodeData } from "../data/mockData";

function StatefulHarness({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));
  return <InAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />;
}

describe("InAppRightPanel — Template tab", () => {
  it("never renders the Merlin AI Generator banner", () => {
    render(<StatefulHarness initialData={{ ...defaultInAppNodeData, displayType: "popup" }} />);
    expect(screen.queryByText("Merlin AI Generator")).not.toBeInTheDocument();
    expect(screen.queryByText(/give a prompt and merlin/i)).not.toBeInTheDocument();
  });

  it("opens the template browse modal directly on the same click that picks a Display Type", () => {
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a pop up template/i.test(el.textContent);
    render(<StatefulHarness initialData={{ ...defaultInAppNodeData }} />);
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Pop Up"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("shows hover Edit/Analytics/Select actions on a template card in the modal", () => {
    render(<StatefulHarness initialData={{ ...defaultInAppNodeData }} />);
    fireEvent.click(screen.getByText("Pop Up"));
    const card = screen.getByText("Cart Recovery Pop Up").closest("div[style*='position: relative']");
    fireEvent.mouseEnter(card);
    expect(within(card).getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /analytics/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /select/i })).toBeInTheDocument();
  });

  it("shows the real selected template content in the right panel's preview, not just a display-type emoji", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultInAppNodeData,
          displayType: "popup",
          template: { id: "ia_001", name: "Cart Recovery Pop Up", useCase: "Cart abandonment", status: "Active", displayType: "popup", blocks: [{ type: "heading", content: "Still thinking it over?" }] },
        }}
      />
    );
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
  });
});
