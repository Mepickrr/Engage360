import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PushRightPanel from "../PushRightPanel";
import { defaultPushNodeData } from "../data/mockData";

function StatefulHarness({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));
  return <PushRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />;
}

describe("PushRightPanel — Template tab", () => {
  it("opens the template picker modal when there's no template yet", () => {
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a push template/i.test(el.textContent);
    render(<StatefulHarness initialData={{ ...defaultPushNodeData }} />);
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Select or create a template"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("shows hover Edit/Analytics/Select actions on a template card in the modal", () => {
    render(<StatefulHarness initialData={{ ...defaultPushNodeData }} />);
    fireEvent.click(screen.getByText("Select or create a template"));
    const card = screen.getByText("Cart Recovery Basic").closest("div[style*='position: relative']");
    fireEvent.mouseEnter(card);
    expect(within(card).getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /analytics/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /select/i })).toBeInTheDocument();
  });

  it("shows a platform preview of the selected template in the right panel", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultPushNodeData,
          template: { id: "push_003", name: "Order Shipped Update", title: "Your order is on the way!", body: "Tracking info inside", style: "basic", platforms: { android: true, ios: true, web: true } },
        }}
      />
    );
    expect(screen.getAllByText("Your order is on the way!").length).toBeGreaterThan(0);
    expect(screen.getByText("Preview for")).toBeInTheDocument();
  });
});
