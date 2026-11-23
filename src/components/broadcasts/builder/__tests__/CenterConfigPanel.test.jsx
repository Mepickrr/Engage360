import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CenterConfigPanel from "../CenterConfigPanel";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";

beforeEach(() => {
  useBroadcastBuilderStore.getState().reset();
});

describe("CenterConfigPanel", () => {
  it("shows the Broadcast Name field bound to store.meta.name for the primary step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    const input = screen.getByTestId("broadcast-name-field");
    fireEvent.change(input, { target: { value: "Diwali Blast" } });
    expect(useBroadcastBuilderStore.getState().meta.name).toBe("Diwali Blast");
  });

  it("shows the Trigger Condition editor for a follow-up step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("trigger-condition-editor")).toBeInTheDocument();
  });

  it("switching to 'On a specific date & time' clears the delay fields", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    expect(useBroadcastBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("date");
    expect(useBroadcastBuilderStore.getState().sequence[1].trigger_condition.delay).toBeNull();
  });

  it("switching back to delay mode clears fire_at", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    fireEvent.click(screen.getByTestId("tc-mode-delay"));
    expect(useBroadcastBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("delay");
    expect(useBroadcastBuilderStore.getState().sequence[1].trigger_condition.fire_at).toBeNull();
  });

  it("shows the behavior selector alongside the timing UI, multi-select with exclusive 'All'", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("sms");
    const behaviors = () => useBroadcastBuilderStore.getState().sequence[1].trigger_condition.behaviors;
    const { rerender } = render(<CenterConfigPanel step={useBroadcastBuilderStore.getState().sequence[1]} />);
    const click = (v) => {
      fireEvent.click(screen.getByTestId(`tc-behavior-${v}`));
      rerender(<CenterConfigPanel step={useBroadcastBuilderStore.getState().sequence[1]} />);
    };

    expect(screen.getByTestId("tc-behavior-delivered_not_viewed")).toBeChecked();
    expect(screen.getByTestId("tc-behavior-failed")).not.toBeChecked();
    expect(screen.getByTestId("tc-mode-delay")).toBeInTheDocument();

    click("failed");
    expect(behaviors()).toEqual(["failed", "delivered_not_viewed"]);
    click("ordered");
    expect(behaviors()).toEqual(["failed", "delivered_not_viewed", "ordered"]);

    click("all");
    expect(behaviors()).toEqual(["all"]);
    expect(screen.getByTestId("tc-behavior-failed")).not.toBeChecked();

    click("clicked_not_ordered");
    expect(behaviors()).toEqual(["clicked_not_ordered"]);
    expect(screen.getByTestId("tc-behavior-all")).not.toBeChecked();

    click("clicked_not_ordered"); // last one can't be unchecked
    expect(behaviors()).toEqual(["clicked_not_ordered"]);
  });

  it("renders WhatsAppBroadcastDetails below the Broadcast Name field for a primary WhatsApp step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("broadcast-name-field")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-broadcast-details")).toBeInTheDocument();
  });

  it("does not render WhatsAppBroadcastDetails for a non-WhatsApp primary step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.queryByTestId("whatsapp-broadcast-details")).not.toBeInTheDocument();
  });

  it("renders WhatsAppFollowupDetails alongside the trigger condition editor for a WhatsApp follow-up step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("whatsapp");
    const step = useBroadcastBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("trigger-condition-editor")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-followup-details")).toBeInTheDocument();
    expect(screen.getByTestId("sender-number-select")).toBeInTheDocument();
    expect(screen.getByTestId("template-summary")).toBeInTheDocument();
    expect(screen.getByTestId("utm-enabled-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("ai-smart-send-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("smart-retry-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("international-audience-toggle")).toBeInTheDocument();
    expect(screen.queryByTestId("source-type-segment")).not.toBeInTheDocument();
    expect(screen.queryByTestId("suppression-list-select")).not.toBeInTheDocument();
    expect(screen.queryByTestId("validity-window-custom-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pricing-view")).not.toBeInTheDocument();
  });

  it("does not render WhatsAppFollowupDetails for a non-WhatsApp follow-up step", () => {
    useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
    useBroadcastBuilderStore.getState().addFollowupStep("sms");
    const step = useBroadcastBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    expect(screen.queryByTestId("whatsapp-followup-details")).not.toBeInTheDocument();
  });
});
