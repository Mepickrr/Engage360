import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IntegrationsPanel from "../IntegrationsPanel";

describe("IntegrationsPanel — Platform group", () => {
  it("lists Shopify, WooCommerce, and Magento rows under Platform", () => {
    render(<IntegrationsPanel />);
    const platformGroup = screen.getByTestId("integration-group-platform");
    expect(screen.getByTestId("integration-row-platform-shopify_1")).toBeInTheDocument();
    expect(screen.getByTestId("integration-row-platform-woocommerce")).toBeInTheDocument();
    expect(screen.getByTestId("integration-row-platform-magento")).toBeInTheDocument();
    expect(platformGroup).toHaveTextContent("WooCommerce");
    expect(platformGroup).toHaveTextContent("Magento");
  });

  it("opens the connect modal with a Store domain field for WooCommerce", () => {
    render(<IntegrationsPanel />);
    fireEvent.click(screen.getByTestId("integration-row-platform-woocommerce"));
    expect(screen.getByTestId("connect-integration-modal")).toBeInTheDocument();
    expect(screen.getByText(/Connect WooCommerce/i)).toBeInTheDocument();
    expect(screen.getByText("Site URL")).toBeInTheDocument();
  });

  it("connects Magento via the form and shows it as connected in the list", () => {
    render(<IntegrationsPanel />);
    fireEvent.click(screen.getByTestId("integration-row-platform-magento"));
    fireEvent.change(screen.getByTestId("connect-integration-form-input"), {
      target: { value: "https://mystore.com" },
    });
    fireEvent.click(screen.getByTestId("connect-integration-form-submit"));

    const magentoRow = screen.getByTestId("integration-row-platform-magento");
    expect(magentoRow).toHaveTextContent("Connected");
  });

  it("still shows Shopify in the Create new integration picker so another platform can be connected alongside it", () => {
    render(<IntegrationsPanel />);
    fireEvent.click(screen.getByTestId("create-integration-btn"));
    expect(screen.getByTestId("connect-integration-type-shopify")).toBeInTheDocument();
    expect(screen.getByTestId("connect-integration-type-woocommerce")).toBeInTheDocument();
    expect(screen.getByTestId("connect-integration-type-magento")).toBeInTheDocument();
  });
});
