import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import PushNode from "../index";

jest.mock("@/store/flowBuilderStore");
jest.mock("../../shared/NodeHoverActions", () => () => null, { virtual: true });

function renderNode(data) {
  const updateNodeData = jest.fn();
  useFlowBuilderStore.mockImplementation((selector) => selector({ updateNodeData }));
  render(
    <ReactFlowProvider>
      <PushNode id="n1" data={data} selected={false} />
    </ReactFlowProvider>
  );
  return { updateNodeData };
}

describe("PushNode canvas card", () => {
  it("shows the empty state with no template", () => {
    renderNode({ label: "Push Notification", template: null });
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("opens the Select Push Template modal directly when clicked while empty", () => {
    renderNode({ label: "Push Notification", template: null });
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a push template/i.test(el.textContent);
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("rf-push-node-n1"));
    expect(screen.getByText(modalHeading)).toBeInTheDocument();
  });

  it("does not auto-open the modal when a template already exists", () => {
    renderNode({
      label: "Push Notification",
      template: { id: "push_003", name: "Order Shipped Update", title: "Your order is on the way!", body: "Tracking info inside", style: "basic" },
    });
    const modalHeading = (_, el) => el.tagName.toLowerCase() === "h2" && /select a push template/i.test(el.textContent);
    fireEvent.click(screen.getByTestId("rf-push-node-n1"));
    expect(screen.queryByText(modalHeading)).not.toBeInTheDocument();
  });
});
