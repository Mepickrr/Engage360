import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LeftSequencePanel from "../LeftSequencePanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("LeftSequencePanel", () => {
  it("renders the primary step card with a PRIMARY badge and NO TEMPLATE SELECTED state", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    expect(screen.getByText("PRIMARY")).toBeInTheDocument();
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("selects a step on click", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const primaryId = useCampaignBuilderStore.getState().sequence[0].id;
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId(`step-card-${primaryId}`));
    expect(useCampaignBuilderStore.getState().selectedStepId).toBe(primaryId);
  });

  it("adding a follow-up excludes WhatsApp from the picker when it's already primary", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    expect(screen.queryByTestId("channel-option-whatsapp")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(useCampaignBuilderStore.getState().sequence).toHaveLength(2);
    expect(useCampaignBuilderStore.getState().sequence[1].channel).toBe("sms");
  });

  it("shows a behavior badge on a new follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("email");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(screen.getByText("ON NOT VIEWED")).toBeInTheDocument();
  });
});
