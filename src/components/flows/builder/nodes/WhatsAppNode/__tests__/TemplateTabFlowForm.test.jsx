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

describe("Flow Form style picker", () => {
  it("shows Flow Form and hides Audio in the Standard group", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: null, template: null });

    expect(screen.getByText("Flow Form")).toBeInTheDocument();
    expect(screen.queryByText("Audio")).not.toBeInTheDocument();
  });
});
