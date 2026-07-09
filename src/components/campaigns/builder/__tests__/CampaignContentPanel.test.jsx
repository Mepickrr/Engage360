import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignContentPanel from "../CampaignContentPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import { WHATSAPP_CATALOG_TEMPLATES } from "../templateCatalog";

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

  it("shows the template gallery for a WhatsApp step with no template yet", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Confirm on a gallery card sets channel_config.template and switches to preview mode", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));

    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-preview-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("template-gallery-panel")).not.toBeInTheDocument();
  });

  it("Change returns to gallery mode", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));
    let updated = useCampaignBuilderStore.getState().sequence[0];
    rerender(<CampaignContentPanel step={updated} />);

    fireEvent.click(screen.getByTestId("change-template-btn"));
    updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template).toBeNull();
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Edit from the gallery opens UnifiedTemplateModal pre-filled, and Save writes the edited draft", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-edit-${first.id}`));

    expect(screen.getByDisplayValue(first.name)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));

    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
  });
});
