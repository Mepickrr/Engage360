// src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyNode.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import ShopifyNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: "top", Right: "right" },
}));

const baseNode = { id: "n1", data: {} };

describe("ShopifyNode", () => {
  it("renders unconfigured state", () => {
    render(<ShopifyNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("rf-shopify-node-n1")).toBeInTheDocument();
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders configured state for order_creation", () => {
    render(<ShopifyNode id="n1" data={{ action: "order_creation" }} selected={false} />);
    expect(screen.getByText("Order Creation")).toBeInTheDocument();
    expect(screen.getByText("Order will be created on Shopify")).toBeInTheDocument();
  });

  it("renders configured state for order_tag with tag preview", () => {
    render(<ShopifyNode id="n1" data={{ action: "order_tag", orderTags: ["vip"] }} selected={false} />);
    expect(screen.getByText(/Order Tag <vip> is Updated/)).toBeInTheDocument();
  });

  it("renders Success and Failed handles", () => {
    render(<ShopifyNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("handle-success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-failed")).toBeInTheDocument();
  });
});
