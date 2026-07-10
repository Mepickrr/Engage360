import React from "react";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import InAppNode from "../index";

jest.mock("../../shared/NodeHoverActions", () => () => null, { virtual: true });
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null, { virtual: true });

function renderNode(data) {
  return render(
    <ReactFlowProvider>
      <InAppNode id="n1" data={data} selected={false} />
    </ReactFlowProvider>
  );
}

describe("InAppNode canvas card", () => {
  it("shows the empty state with no display type/template", () => {
    renderNode({ label: "InApp Message", displayType: null, template: null });
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders the template's real content in the mini preview, not just a display-type emoji", () => {
    renderNode({
      label: "InApp Message",
      displayType: "popup",
      template: { name: "Cart Recovery Pop Up", displayType: "popup", blocks: [{ type: "heading", content: "Still thinking it over?" }] },
    });
    expect(screen.getByText("Still thinking it over?")).toBeInTheDocument();
  });
});
