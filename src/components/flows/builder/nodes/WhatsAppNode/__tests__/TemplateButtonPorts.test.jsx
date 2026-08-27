import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";
import { isConnectable } from "../data/mockTemplates";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right", Left: "left" },
}));

jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

function renderNode(buttons) {
  return render(
    <WhatsAppNode
      id="node_1"
      data={{
        templateStyle: "standard",
        template: { name: "tpl", status: "Active", body: "Hello", buttons },
      }}
      selected={false}
    />
  );
}

describe("mockTemplates.isConnectable", () => {
  it("treats QUICK_REPLY and FLOW as connectable", () => {
    expect(isConnectable({ type: "QUICK_REPLY" })).toBe(true);
    expect(isConnectable({ type: "FLOW" })).toBe(true);
  });

  it("does not treat URL or PHONE as connectable", () => {
    expect(isConnectable({ type: "URL" })).toBe(false);
    expect(isConnectable({ type: "PHONE" })).toBe(false);
  });
});

describe("WhatsAppNode — canvas CTA buttons and output ports", () => {
  it("shows a Quick Reply button inline with an output port", () => {
    renderNode([{ type: "QUICK_REPLY", label: "Shop Now" }]);
    expect(screen.getByText("Shop Now")).toBeInTheDocument();
    expect(screen.getByTestId("handle-btn_0")).toBeInTheDocument();
  });

  it("shows URL and Phone CTA buttons in the preview without giving them an output port", () => {
    renderNode([
      { type: "URL", label: "Visit Site" },
      { type: "PHONE", label: "Call Us" },
    ]);
    expect(screen.getByText("Visit Site")).toBeInTheDocument();
    expect(screen.getByText("Call Us")).toBeInTheDocument();
    expect(screen.queryByTestId("handle-btn_0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("handle-btn_1")).not.toBeInTheDocument();
  });

  it("numbers ports only over connectable buttons, skipping URL/Phone in between", () => {
    renderNode([
      { type: "URL", label: "Visit Site" },
      { type: "QUICK_REPLY", label: "Shop Now" },
      { type: "PHONE", label: "Call Us" },
      { type: "FLOW", label: "Start Flow" },
    ]);
    expect(screen.getByTestId("handle-btn_0")).toBeInTheDocument(); // Shop Now
    expect(screen.getByTestId("handle-btn_1")).toBeInTheDocument(); // Start Flow
    expect(screen.queryByTestId("handle-btn_2")).not.toBeInTheDocument();
  });
});
