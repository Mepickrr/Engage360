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

describe("TemplateTab collect_input routing", () => {
  it("opens the unified modal with CollectInputForm when Create New is clicked", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: "collect_input", template: null });
    // First click opens the UnifiedTemplateModal in its browse view (seeded templates for the style).
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    // Then "+ Create new" inside the modal's browse view opens a blank CollectInputForm edit view.
    fireEvent.click(screen.getByRole("button", { name: /\+ Create new/ }));
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByText("Input Type")).toBeInTheDocument();
  });

  it("shows configured summary when template is set", () => {
    renderPanel({
      wabaNumberId: "waba_1",
      templateStyle: "collect_input",
      template: { isCollectInput: true, inputType: "email", questionMessage: "What is your email?", retryAttempts: 3 },
    });
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
