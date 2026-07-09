import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppBroadcastDetails from "../WhatsAppBroadcastDetails";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

function getStep() {
  return useCampaignBuilderStore.getState().sequence[0];
}

describe("WhatsAppBroadcastDetails", () => {
  it("shows the Quality Rating / Messaging Limit strip by default (sender pre-selected) and updates when changed", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("quality-limit-strip")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("sender-number-select"), { target: { value: "waba_2" } });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByText("Yellow")).toBeInTheDocument();
  });

  it("shows the audience resolved count once a segment is selected via BroadcastSourceStep1", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);

    fireEvent.click(screen.getByTestId("source-type-segment"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);

    // BroadcastSourceStep1's SegmentSourceConfig renders one sr-only checkbox per mock segment.
    const firstSegmentCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstSegmentCheckbox);
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("resolved-audience-count")).toBeInTheDocument();
  });

  it("toggles UTM Tracking and edits the fields", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(getStep().channel_config.utm.source).toBe("Engage 360");

    fireEvent.click(screen.getByTestId("utm-enabled-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.change(screen.getByTestId("utm-campaign-field"), { target: { value: "Diwali Blast" } });
    expect(getStep().channel_config.utm.campaign).toBe("Diwali Blast");
  });

  it("Smart Retry toggle reveals a capped retry-window input", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.click(screen.getByTestId("smart-retry-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.change(screen.getByTestId("smart-retry-window"), { target: { value: "999" } });
    expect(getStep().channel_config.campaignSmartRetry.windowHours).toBe(72);
  });

  it("Fallback section only renders once a template is selected, and Category Change only once fallback is enabled", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.queryByText("Fallback Template")).not.toBeInTheDocument();

    useCampaignBuilderStore.getState().updateStepChannelConfig(getStep().id, { template: { name: "t1" } });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByText("Fallback Template")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback-category-change-toggle")).not.toBeInTheDocument();

    useCampaignBuilderStore.getState().updateStepChannelConfig(getStep().id, {
      fallback: { ...getStep().channel_config.fallback, enabled: true },
    });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("fallback-category-change-toggle")).toBeInTheDocument();
  });

  it("Validity Window defaults to standard 10 minutes and switches to a custom input", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByText(/Standard 10-minute/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("validity-window-custom-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("validity-window-minutes")).toBeInTheDocument();
  });

  it("Pricing view computes rate times resolved audience", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("pricing-view")).toHaveTextContent("₹1.5");
  });
});
