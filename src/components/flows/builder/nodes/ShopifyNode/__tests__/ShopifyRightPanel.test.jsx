// src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyRightPanel.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopifyRightPanel from "../ShopifyRightPanel";

const makeNode = (data = {}) => ({ id: "n1", data });
const noop = jest.fn();

describe("ShopifyRightPanel", () => {
  it("shows action picker when no action set", () => {
    render(<ShopifyRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByText("Order Creation")).toBeInTheDocument();
    expect(screen.getByText("Discount Code")).toBeInTheDocument();
  });

  it("selecting an action calls updateNodeData with that action", () => {
    const update = jest.fn();
    render(<ShopifyRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("shopify-action-order_creation"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "order_creation" }));
  });

  it("shows change-action link when action is set", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_creation" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("shopify-change-action")).toBeInTheDocument();
  });

  it("change-action resets action to null", () => {
    const update = jest.fn();
    render(<ShopifyRightPanel node={makeNode({ action: "order_tag", orderTags: ["a"] })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("shopify-change-action"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
  });

  it("renders tag input for order_tag action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_tag", orderTags: [] })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("order-tags-input")).toBeInTheDocument();
  });

  it("renders tag input for customer_tag action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "customer_tag", customerTags: [] })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("customer-tags-input")).toBeInTheDocument();
  });

  it("renders notes textarea for order_notes action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_notes", orderNote: "" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("order-notes-input")).toBeInTheDocument();
  });

  it("renders discount title input for discount_code action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "discount_code", discount: { title: "", type: "amount", appliesTo: "entire_order", minPurchaseEnabled: false, expirationEnabled: false, expirationType: "days" } })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("discount-title")).toBeInTheDocument();
  });
});
