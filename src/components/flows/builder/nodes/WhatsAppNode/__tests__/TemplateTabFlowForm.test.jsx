import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

describe("Flow Form — Complete flow button preselected on Create New", () => {
  it("pre-selects Complete flow as the button type when creating a brand-new Flow Form template", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: "flow_form", template: null });

    // Empty state -> "Create New" dashed box opens UnifiedTemplateModal in browse mode.
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    // Browse view's own "+ Create new" opens a blank edit-mode draft. Queried via
    // textContent (not getByRole/getByText) because this environment's dev-tooling
    // instrumentation (@emergentbase/visual-edits, active under NODE_ENV=test) can
    // render duplicate accessible-name nodes for the same visible button.
    const createNewInBrowse = Array.from(document.querySelectorAll("button")).find((b) => /^\+ create new$/i.test(b.textContent.trim()));
    fireEvent.click(createNewInBrowse);

    const buttonTypeSelect = Array.from(document.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "FLOW")
    );
    expect(buttonTypeSelect).toBeTruthy();
    expect(buttonTypeSelect.value).toBe("FLOW");
    expect(screen.getByDisplayValue("View Flow")).toBeInTheDocument();
  });
});
