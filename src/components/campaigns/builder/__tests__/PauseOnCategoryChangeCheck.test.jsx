import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PauseOnCategoryChangeCheck from "../PauseOnCategoryChangeCheck";
import WhatsAppBroadcastDetails from "../WhatsAppBroadcastDetails";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

const utility = { name: "order_update_v2", type: "Utility" };
const marketing = { name: "flash_sale", type: "Marketing" };

describe("PauseOnCategoryChangeCheck", () => {
  it("is usable before a template is chosen", () => {
    const onChange = jest.fn();
    render(<PauseOnCategoryChangeCheck onChange={onChange} />);
    fireEvent.click(screen.getByTestId("pause-on-category-change-toggle"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows what happens and the spend at risk when enabled on a Utility template", () => {
    render(<PauseOnCategoryChangeCheck template={utility} enabled audienceCount={10000} onChange={() => {}} />);
    expect(screen.getByTestId("pause-on-category-change-details")).toBeInTheDocument();
    // 10,000 x (0.85 - 0.15)
    expect(screen.getByTestId("pause-on-category-change-risk").textContent).toContain("₹7,000");
    expect(screen.queryByTestId("pause-on-category-change-conflict")).toBeNull();
  });

  it("hides details when disabled", () => {
    render(<PauseOnCategoryChangeCheck template={utility} enabled={false} onChange={() => {}} />);
    expect(screen.queryByTestId("pause-on-category-change-details")).toBeNull();
  });

  it("is disabled and unchecked for a template that is already Marketing", () => {
    render(<PauseOnCategoryChangeCheck template={marketing} enabled onChange={() => {}} />);
    const box = screen.getByTestId("pause-on-category-change-toggle");
    expect(box).toBeDisabled();
    expect(box).not.toBeChecked();
    expect(screen.getByTestId("pause-on-category-change-na")).toBeInTheDocument();
  });

  it("warns that pausing overrides the category-change fallback", () => {
    render(<PauseOnCategoryChangeCheck template={utility} enabled fallbackOnCategoryChange onChange={() => {}} />);
    expect(screen.getByTestId("pause-on-category-change-conflict")).toBeInTheDocument();
  });

  it("saves to channel_config.pauseOnCategoryChange in the campaign builder", () => {
    useCampaignBuilderStore.getState().reset();
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<WhatsAppBroadcastDetails step={useCampaignBuilderStore.getState().sequence[0]} />);
    fireEvent.click(screen.getByTestId("pause-on-category-change-toggle"));
    expect(useCampaignBuilderStore.getState().sequence[0].channel_config.pauseOnCategoryChange).toEqual({ enabled: true });
  });
});
