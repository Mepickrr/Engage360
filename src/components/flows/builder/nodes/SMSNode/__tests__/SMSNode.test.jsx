import React from "react";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import SMSNode from "../index";

jest.mock("../shared/NodeHoverActions", () => () => null, { virtual: true });
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null, { virtual: true });

function renderNode(data) {
  return render(
    <ReactFlowProvider>
      <SMSNode id="n1" data={data} selected={false} />
    </ReactFlowProvider>
  );
}

describe("SMSNode canvas card", () => {
  it("shows the sender ID chip (not a crash) when a node has a senderIdId and a template", () => {
    renderNode({
      label: "Send SMS",
      senderIdId: "trustsignal_txtind",
      template: { name: "order_shipped", status: "Approved", body: "Your order shipped" },
    });
    expect(screen.getByText("TXTIND")).toBeInTheDocument();
  });

  it("renders the empty state with no chip when there's no template yet", () => {
    renderNode({ label: "Send SMS", senderIdId: null, template: null });
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });
});
