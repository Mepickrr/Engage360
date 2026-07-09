import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignContentPanel from "../CampaignContentPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("CampaignContentPanel", () => {
  it("shows NO TEMPLATE SELECTED for a non-WhatsApp channel", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("renders Flow Builder's TemplateTab for WhatsApp, starting at the sender-number step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByText("Sender Number")).toBeInTheDocument();
  });

  it("advancing to a sender number reveals the template style picker, wired through the same patch contract", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "waba_1" } });

    const updatedStep = useCampaignBuilderStore.getState().sequence[0];
    expect(updatedStep.channel_config.wabaNumberId).toBe("waba_1");
    rerender(<CampaignContentPanel step={updatedStep} />);

    expect(screen.getByText("Choose Template Style")).toBeInTheDocument();
  });
});
