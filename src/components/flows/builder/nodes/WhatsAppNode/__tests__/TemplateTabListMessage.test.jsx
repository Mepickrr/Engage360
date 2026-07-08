import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowVariantContext } from "../../../../FlowVariantContext";
import WhatsAppRightPanel from "../WhatsAppRightPanel";

function renderPanel(nodeData) {
  const updateNodeData = jest.fn();
  const removeNode = jest.fn();
  const node = { id: "node_1", data: nodeData };
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
      <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
    </FlowVariantContext.Provider>
  );
  return { updateNodeData, removeNode };
}

describe("TemplateTab list routing", () => {
  it("opens the unified modal with ListMessageForm when Create New is clicked", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: "list", template: null });
    // First click opens the UnifiedTemplateModal in its browse view (seeded templates for the style).
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    // Then "+ Create new" inside the modal's browse view opens a blank ListMessageForm edit view.
    fireEvent.click(screen.getByRole("button", { name: /\+ Create new/ }));
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });

  it("does NOT show the FBM amber warning for list style", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: "list", template: null });
    expect(screen.queryByText(/business manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/whatsapp manager/i)).not.toBeInTheDocument();
  });

  it("shows configured summary card when template is set", () => {
    renderPanel({
      wabaNumberId: "waba_1",
      templateStyle: "list",
      template: {
        isListMessage: true,
        header: "",
        body: "Pick a plan for your business",
        footer: "",
        buttonText: "View plans",
        sections: [
          { title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] },
        ],
      },
    });
    expect(screen.getByText(/pick a plan/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("does NOT show the FBM template section when template is configured", () => {
    renderPanel({
      wabaNumberId: "waba_1",
      templateStyle: "list",
      template: {
        isListMessage: true,
        header: "",
        body: "Pick a plan",
        footer: "",
        buttonText: "View",
        sections: [{ title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] }],
      },
    });
    expect(screen.queryByText(/business manager/i)).not.toBeInTheDocument();
  });
});
