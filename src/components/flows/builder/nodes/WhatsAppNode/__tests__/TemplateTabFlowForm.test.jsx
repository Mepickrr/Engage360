import React from "react";
import { render, screen } from "@testing-library/react";
import { FlowVariantContext } from "../../../../FlowVariantContext";
import WhatsAppRightPanel from "../WhatsAppRightPanel";
import WhatsAppBubblePreview from "../WhatsAppBubblePreview";
import WhatsAppNode from "../index";
import { ReactFlowProvider } from "reactflow";
import { isConnectable } from "../data/mockTemplates";
import { V2_ALLOWED_TEMPLATE_STYLES } from "@/pages/flowBuilderV2Constants";

function renderPanel(nodeData, allowedTemplateStyleIds = null) {
  const updateNodeData = jest.fn();
  const removeNode = jest.fn();
  const node = { id: "node_1", data: nodeData };
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds }}>
      <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
    </FlowVariantContext.Provider>
  );
  return { updateNodeData, removeNode };
}

describe("Flow Form style picker", () => {
  it("shows Flow Form and hides Audio in the Standard group (v1 — no allow-list)", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: null, template: null });

    expect(screen.getByText("Flow Form")).toBeInTheDocument();
    expect(screen.queryByText("Audio")).not.toBeInTheDocument();
  });

  it("shows Flow Form under v2's real allow-list (V2_ALLOWED_TEMPLATE_STYLES)", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: null, template: null }, V2_ALLOWED_TEMPLATE_STYLES);

    expect(screen.getByText("Flow Form")).toBeInTheDocument();
  });
});

describe("Flow Form — bubble preview and canvas port", () => {
  it("shows a 🔗-prefixed button row in the bubble preview once a flow is linked", () => {
    render(
      <WhatsAppBubblePreview
        draft={{ body: "Fill this out", buttons: [{ type: "FLOW", label: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" }] }}
        previewKind="standard"
      />
    );
    expect(screen.getByText("🔗 View Flow")).toBeInTheDocument();
  });

  it("shows the flow button row with its label even before a flow is linked", () => {
    render(<WhatsAppBubblePreview draft={{ body: "Fill this out", buttons: [{ type: "FLOW", label: "View Flow", flowFormId: null, flowFormName: null }] }} previewKind="standard" />);
    expect(screen.getByText("🔗 View Flow")).toBeInTheDocument();
  });

  it("does not 🔗-prefix regular button types", () => {
    render(<WhatsAppBubblePreview draft={{ body: "Fill this out", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] }} previewKind="standard" />);
    expect(screen.getByText("Shop Now")).toBeInTheDocument();
    expect(screen.queryByText(/🔗/)).not.toBeInTheDocument();
  });

  it("exposes a connectable FLOW button for the canvas port once a flow is linked", () => {
    render(
      <ReactFlowProvider>
        <WhatsAppNode
          id="node_1"
          selected={false}
          data={{
            templateStyle: "flow_form",
            wabaNumberId: "waba_1",
            template: { name: "flow_tpl", body: "Fill this out", buttons: [{ type: "FLOW", label: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" }] },
          }}
        />
      </ReactFlowProvider>
    );
    expect(screen.getByText("View Flow")).toBeInTheDocument();
  });

  it("exposes a connectable FLOW button for the canvas port even before a flow is linked", () => {
    render(
      <ReactFlowProvider>
        <WhatsAppNode
          id="node_1"
          selected={false}
          data={{
            templateStyle: "flow_form",
            wabaNumberId: "waba_1",
            template: { name: "flow_tpl", body: "Fill this out", buttons: [{ type: "FLOW", label: "View Flow", flowFormId: null, flowFormName: null }] },
          }}
        />
      </ReactFlowProvider>
    );
    expect(screen.getByText("View Flow")).toBeInTheDocument();
  });
});
