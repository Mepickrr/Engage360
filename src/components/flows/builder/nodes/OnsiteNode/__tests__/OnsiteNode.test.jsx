import React from "react";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import OnsiteNode from "../index";

jest.mock("../../shared/NodeHoverActions", () => () => null, { virtual: true });
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null, { virtual: true });

function renderNode(data) {
  return render(
    <ReactFlowProvider>
      <OnsiteNode id="n1" data={data} selected={false} />
    </ReactFlowProvider>
  );
}

describe("OnsiteNode canvas card", () => {
  it("shows the empty state with no display type/template", () => {
    renderNode({ label: "Onsite Message", displayType: null, template: null });
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders the template's real content in the mini preview, not just a display-type emoji", () => {
    renderNode({
      label: "Onsite Message",
      displayType: "popup",
      template: { name: "Cart Recovery Popup", displayType: "popup", blocks: [{ type: "title", content: "Still thinking it over?" }] },
    });
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
  });
});
