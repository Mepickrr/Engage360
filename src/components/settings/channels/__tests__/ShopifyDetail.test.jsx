import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopifyDetail from "../ShopifyDetail";

const STORE = {
  id: "shopify_1", name: "Herbal Roots", domain: "https://herbalroots.com",
  webhookStatus: "Live", customers: 921681, orders: 858226, products: 111,
  shortCode: "", websiteEventsScopeGranted: true, websiteEventsTrackerEnabled: true,
};

describe("ShopifyDetail", () => {
  it("renders the Details tab by default with store info and stat tiles", () => {
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={jest.fn()} />);
    expect(screen.getByText("Herbal Roots")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("921,681")).toBeInTheDocument();
    expect(screen.getByText("858,226")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
  });

  it("switches to the Others tab and shows the short code and tracker toggle", () => {
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={jest.fn()} />);
    // Radix's TabsTrigger activates on mousedown (not click), so a real user
    // click — which always fires mousedown before click — is simulated with
    // fireEvent.mouseDown here; fireEvent.click alone never reaches jsdom's
    // synthetic mousedown/focus path and the tab would never switch.
    fireEvent.mouseDown(screen.getByTestId("shopify-tab-others"));
    expect(screen.getByTestId("shopify-shortcode-input")).toBeInTheDocument();
    expect(screen.getByText("Scopes for website events")).toBeInTheDocument();
  });

  it("disables Save until a short code is typed, then calls onUpdate", () => {
    const onUpdate = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.mouseDown(screen.getByTestId("shopify-tab-others"));

    const saveBtn = screen.getByTestId("shopify-shortcode-save");
    expect(saveBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId("shopify-shortcode-input"), { target: { value: "HR-UK" } });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onUpdate).toHaveBeenCalledWith({ shortCode: "HR-UK" });
  });

  it("toggles the website events tracker and calls onUpdate", () => {
    const onUpdate = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.mouseDown(screen.getByTestId("shopify-tab-others"));
    fireEvent.click(screen.getByLabelText(/enable website events tracker/i));
    expect(onUpdate).toHaveBeenCalledWith({ websiteEventsTrackerEnabled: false });
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={onBack} onUpdate={jest.fn()} />);
    fireEvent.click(screen.getByTestId("shopify-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
