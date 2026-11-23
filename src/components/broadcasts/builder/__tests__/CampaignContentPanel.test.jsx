import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignContentPanel from "../CampaignContentPanel";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";
import { WHATSAPP_CATALOG_TEMPLATES } from "../templateCatalog";

beforeEach(() => {
  useBroadcastBuilderStore.getState().reset();
});

describe("CampaignContentPanel", () => {
  it("shows NO TEMPLATE SELECTED for a non-WhatsApp channel", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("shows the template gallery for a WhatsApp step with no template yet", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Confirm on a gallery card sets channel_config.template and switches to preview mode", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));

    const updated = useBroadcastBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-preview-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("template-gallery-panel")).not.toBeInTheDocument();
  });

  it("Change returns to gallery mode", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));
    let updated = useBroadcastBuilderStore.getState().sequence[0];
    rerender(<CampaignContentPanel step={updated} />);

    fireEvent.click(screen.getByTestId("change-template-btn"));
    updated = useBroadcastBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template).toBeNull();
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Edit from the gallery opens UnifiedTemplateModal pre-filled, and Save writes the edited draft", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-edit-${first.id}`));

    expect(screen.getByDisplayValue(first.name)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));

    const updated = useBroadcastBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
  });
});
