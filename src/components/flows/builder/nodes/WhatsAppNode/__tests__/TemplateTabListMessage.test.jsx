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
  it("shows ListMessageForm when templateStyle is list and no template", () => {
    renderPanel({ templateStyle: "list", template: null });
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });

  it("does NOT show the FBM amber warning for list style", () => {
    renderPanel({ templateStyle: "list", template: null });
    expect(screen.queryByText(/business manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/whatsapp manager/i)).not.toBeInTheDocument();
  });

  it("shows configured summary card when template is set", () => {
    renderPanel({
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
    expect(screen.getByText("List Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByText(/pick a plan/i)).toBeInTheDocument();
  });

  it("does NOT show the FBM template section when template is configured", () => {
    renderPanel({
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
    expect(screen.queryByText(/open whatsapp manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+ create new/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select existing/i)).not.toBeInTheDocument();
  });

  it("re-opens ListMessageForm when Edit is clicked on the summary card", () => {
    renderPanel({
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
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });
});
