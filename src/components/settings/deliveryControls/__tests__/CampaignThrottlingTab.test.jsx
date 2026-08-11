import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignThrottlingTab from "../CampaignThrottlingTab";

describe("CampaignThrottlingTab", () => {
  test("renders a throttling row for each channel with its limits", () => {
    render(<CampaignThrottlingTab />);
    expect(screen.getByTestId("throttling-row-push")).toBeInTheDocument();
    expect(screen.getByTestId("throttling-row-smsRcs")).toBeInTheDocument();
    expect(screen.getByTestId("throttling-row-email")).toBeInTheDocument();
    expect(screen.getByTestId("throttling-row-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("throttling-row-connectors")).toBeInTheDocument();

    expect(screen.getByTestId("throttling-row-push").textContent).toContain("Maximum allowed: 1,000,000");
    expect(screen.getByTestId("throttling-row-email").textContent).toContain("Minimum required: 1,000");
  });

  test("limit input is disabled until its channel toggle is switched on", () => {
    render(<CampaignThrottlingTab />);
    expect(screen.getByTestId("throttling-row-whatsapp-limit")).toBeDisabled();
    fireEvent.click(screen.getByTestId("throttling-row-whatsapp-enabled"));
    expect(screen.getByTestId("throttling-row-whatsapp-limit")).not.toBeDisabled();
  });

  test("Save Configurations is disabled until a change is made, then enabled", () => {
    render(<CampaignThrottlingTab />);
    expect(screen.getByTestId("campaign-throttling-save")).toBeDisabled();
    fireEvent.click(screen.getByTestId("throttling-row-push-enabled"));
    expect(screen.getByTestId("campaign-throttling-save")).not.toBeDisabled();
  });

  test("Discard reverts an unsaved toggle change", () => {
    render(<CampaignThrottlingTab />);
    fireEvent.click(screen.getByTestId("throttling-row-push-enabled"));
    expect(screen.getByTestId("throttling-row-push-enabled")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByTestId("campaign-throttling-discard"));
    expect(screen.getByTestId("throttling-row-push-enabled")).toHaveAttribute("aria-checked", "false");
  });
});
