import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import RCSRightPanel from "../RCSRightPanel";
import { defaultRCSNodeData } from "../data/mockData";

jest.mock("@/store/flowBuilderStore");

function StatefulHarness({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));

  useFlowBuilderStore.mockImplementation((selector) =>
    selector({
      selectedNodeId: "n1",
      nodes: [node],
      updateNodeData,
      removeNode: () => {},
    })
  );

  return <RCSRightPanel />;
}

describe("RCSRightPanel — Template Style picker", () => {
  it("shows the Template Style cards (Transactional/Promotional) with always-visible descriptions", () => {
    render(<StatefulHarness initialData={{ ...defaultRCSNodeData }} />);
    expect(screen.getByText("Choose Template Style")).toBeInTheDocument();
    expect(screen.getByText("Transactional")).toBeInTheDocument();
    expect(screen.getByText("Promotional")).toBeInTheDocument();
    expect(screen.getByText(/order updates, otps, delivery alerts/i)).toBeInTheDocument();
  });

  it("opens the template picker modal directly on the same click that selects a style", () => {
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a transactional template/i.test(el.textContent);
    render(<StatefulHarness initialData={{ ...defaultRCSNodeData }} />);
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Transactional"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("filters the modal's templates to the chosen style (Promotional excludes Transactional-only templates)", () => {
    render(<StatefulHarness initialData={{ ...defaultRCSNodeData }} />);
    fireEvent.click(screen.getByText("Promotional"));
    expect(screen.getByText("Promotional Offer")).toBeInTheDocument();
    expect(screen.queryByText("Welcome Message")).not.toBeInTheDocument();
  });

  it("shows a bubble preview of the selected template's content in the right panel", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultRCSNodeData,
          templateStyle: "Transactional",
          template: { id: "rcs_order_update", name: "Order Update", type: "Transactional", status: "Approved", style: "single", mediaType: "none", body: "Your order is on its way!", buttons: [] },
        }}
      />
    );
    expect(screen.getByText("Your order is on its way!")).toBeInTheDocument();
  });

  it("resets templateStyle and template when 'Change' is clicked on the style chip", () => {
    render(
      <StatefulHarness
        initialData={{
          ...defaultRCSNodeData,
          templateStyle: "Transactional",
          template: { id: "rcs_order_update", name: "Order Update", type: "Transactional", status: "Approved", style: "single", mediaType: "none", body: "Your order is on its way!", buttons: [] },
        }}
      />
    );
    fireEvent.click(screen.getAllByText("Change")[0]); // style chip's "Change", not the template card's
    expect(screen.getByText("Choose Template Style")).toBeInTheDocument();
  });
});
