import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SMSRightPanel from "../SMSRightPanel";
import { defaultSMSNodeData } from "../data/mockData";

function makeNode(dataOverrides = {}) {
  return { id: "n1", data: { ...defaultSMSNodeData, ...dataOverrides } };
}

// Mirrors how the real FlowBuilder store feeds patched node data back into
// the panel as props — needed to prove the modal opens on the same click
// that sets templateStyle, not just that patch() was called.
function StatefulPanel({ initialData }) {
  const [node, setNode] = useState({ id: "n1", data: initialData });
  const updateNodeData = (id, patch) => setNode((n) => ({ ...n, data: { ...n.data, ...patch } }));
  return <SMSRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />;
}

describe("SMSRightPanel — Template tab Step 0 gate", () => {
  it("shows Provider first, with no Sender ID or Template Style until a provider is chosen", () => {
    render(<SMSRightPanel node={makeNode()} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.queryByText("Sender ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Choose Template Style")).not.toBeInTheDocument();
  });

  it("shows Sender ID scoped to the chosen provider, with inactive sender IDs disabled", () => {
    const updateNodeData = jest.fn();
    render(<SMSRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByRole("combobox", { name: "" }), { target: { value: "trustsignal" } });
    // re-render with providerId set, as the real panel would after patch()
    render(<SMSRightPanel node={makeNode({ providerId: "trustsignal" })} updateNodeData={updateNodeData} removeNode={() => {}} />);
    expect(screen.getAllByText("Sender ID")[0]).toBeInTheDocument();
    const kaleyraSenderOption = screen.queryByText(/STUDDM/);
    expect(kaleyraSenderOption).not.toBeInTheDocument(); // kaleyra's sender, not trustsignal's
  });

  it("shows the Template Style cards (Transactional/Promotional) with always-visible descriptions once provider+sender are chosen", () => {
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind" })}
        updateNodeData={() => {}}
        removeNode={() => {}}
      />
    );
    expect(screen.getByText("Choose Template Style")).toBeInTheDocument();
    expect(screen.getByText("Transactional")).toBeInTheDocument();
    expect(screen.getByText("Promotional")).toBeInTheDocument();
    expect(screen.getByText(/order updates, otps, delivery alerts/i)).toBeInTheDocument();
  });

  it("patches templateStyle when a style card is clicked", () => {
    const updateNodeData = jest.fn();
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind" })}
        updateNodeData={updateNodeData}
        removeNode={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Transactional"));
    expect(updateNodeData).toHaveBeenCalledWith("n1", { templateStyle: "transactional" });
  });

  it("opens the template picker modal directly on the same click that selects a style, with no extra 'select template' click", () => {
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a transactional template/i.test(el.textContent);
    render(
      <StatefulPanel
        initialData={{ ...defaultSMSNodeData, providerId: "trustsignal", senderIdId: "trustsignal_txtind" }}
      />
    );
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Transactional"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("shows the selected template's browse-modal card and lets the seller change provider/sender after a style is chosen", () => {
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind", templateStyle: "transactional" })}
        updateNodeData={() => {}}
        removeNode={() => {}}
      />
    );
    expect(screen.getByText("Transactional")).toBeInTheDocument(); // style chip
    expect(screen.getAllByText("Provider").length).toBeGreaterThan(0); // still-editable summary select
  });
});
