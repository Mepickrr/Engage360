import React from "react";
import { render, screen } from "@testing-library/react";
import SmartCardSection from "../SmartCardSection";

const FIXTURE = {
  autofillTriggerRate: 62,
  acceptanceRate: 78,
  fieldEditRates: [
    { field: "Name", editRate: 4 }, { field: "Phone", editRate: 6 }, { field: "Address", editRate: 17 }, { field: "Pincode", editRate: 9 },
  ],
  checkoutTimeSeconds: { smartCard: 32, manual: 118 },
  conversionRate: { smartCard: 38, standard: 21 },
  dropoffByStep: [{ step: "Cart", withSmartCard: 8, withoutSmartCard: 20 }],
};

describe("SmartCardSection", () => {
  test("shows skeleton while loading", () => {
    render(<SmartCardSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-smart-card-skeleton")).toBeInTheDocument();
  });

  test("the conversion-rate comparison is given visual priority (rendered first)", () => {
    const { container } = render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    const conversionIndex = container.innerHTML.indexOf("fastrr-smart-card-conversion");
    const ratesIndex = container.innerHTML.indexOf("fastrr-smart-card-rates");
    expect(conversionIndex).toBeGreaterThan(-1);
    expect(conversionIndex).toBeLessThan(ratesIndex);
  });

  test("renders checkout time using formatSeconds", () => {
    render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-smart-card-checkout-time")).toHaveTextContent("32s");
    expect(screen.getByTestId("fastrr-smart-card-checkout-time")).toHaveTextContent("1m 58s");
  });

  test("field edit rates cover Name, Phone, Address, Pincode", () => {
    render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-field-edit-rate-name")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-phone")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-address")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-pincode")).toBeInTheDocument();
  });

  test("renders a MetricTooltip trigger for Acceptance Rate inside the rates card", () => {
    render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    const ratesCard = screen.getByTestId("fastrr-smart-card-rates");
    expect(ratesCard.querySelector('[data-testid="metric-tooltip-trigger"]')).toBeInTheDocument();
  });
});
