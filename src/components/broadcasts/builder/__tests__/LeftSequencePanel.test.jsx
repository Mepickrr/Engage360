import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LeftSequencePanel from "../LeftSequencePanel";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";

beforeEach(() => {
  useBroadcastBuilderStore.getState().reset();
});

describe("LeftSequencePanel", () => {
  it("renders the primary step card with a PRIMARY badge and NO TEMPLATE SELECTED state", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    expect(screen.getByText("PRIMARY")).toBeInTheDocument();
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("selects a step on click", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const primaryId = useBroadcastBuilderStore.getState().sequence[0].id;
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId(`step-card-${primaryId}`));
    expect(useBroadcastBuilderStore.getState().selectedStepId).toBe(primaryId);
  });

  it("allows WhatsApp as a follow-up channel even when it's already primary", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    expect(screen.getByTestId("channel-option-whatsapp")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("channel-option-whatsapp"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(useBroadcastBuilderStore.getState().sequence).toHaveLength(2);
    expect(useBroadcastBuilderStore.getState().sequence[1].channel).toBe("whatsapp");
  });

  it("shows a behavior badge on a new follow-up step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("email");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(screen.getByText("ON NOT VIEWED")).toBeInTheDocument();
  });
});
