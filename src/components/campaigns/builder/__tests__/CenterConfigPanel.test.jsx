import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CenterConfigPanel from "../CenterConfigPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("CenterConfigPanel", () => {
  it("shows the Broadcast Name field bound to store.meta.name for the primary step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    const input = screen.getByTestId("broadcast-name-field");
    fireEvent.change(input, { target: { value: "Diwali Blast" } });
    expect(useCampaignBuilderStore.getState().meta.name).toBe("Diwali Blast");
  });

  it("shows the Trigger Condition editor for a follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("trigger-condition-editor")).toBeInTheDocument();
  });

  it("switching to 'On a specific date & time' clears the delay fields", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("date");
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.delay).toBeNull();
  });

  it("switching back to delay mode clears fire_at", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    fireEvent.click(screen.getByTestId("tc-mode-delay"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("delay");
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.fire_at).toBeNull();
  });

  it("shows the behavior selector alongside the timing UI, single-select", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);

    expect(screen.getByTestId("tc-behavior-delivered_not_viewed")).toBeChecked();
    expect(screen.getByTestId("tc-behavior-failed")).not.toBeChecked();

    fireEvent.click(screen.getByTestId("tc-behavior-failed"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.behavior).toBe("failed");
    expect(screen.getByTestId("tc-mode-delay")).toBeInTheDocument();
  });

  it("renders WhatsAppBroadcastDetails below the Broadcast Name field for a primary WhatsApp step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("broadcast-name-field")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-broadcast-details")).toBeInTheDocument();
  });

  it("does not render WhatsAppBroadcastDetails for a non-WhatsApp primary step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.queryByTestId("whatsapp-broadcast-details")).not.toBeInTheDocument();
  });
});
