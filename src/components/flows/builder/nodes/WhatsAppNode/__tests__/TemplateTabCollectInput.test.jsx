import React from "react";
import { render, screen } from "@testing-library/react";
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
  it("shows CollectInputForm when templateStyle is collect_input and no template", () => {
    renderPanel({ templateStyle: "collect_input", template: null });
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByText("Input Type")).toBeInTheDocument();
  });

  it("shows configured summary when template is set", () => {
    renderPanel({
      templateStyle: "collect_input",
      template: { isCollectInput: true, inputType: "email", questionMessage: "What is your email?", retryAttempts: 3 },
    });
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
