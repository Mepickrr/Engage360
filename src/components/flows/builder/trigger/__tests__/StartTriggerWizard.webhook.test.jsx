import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

function pickWebhookTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Webhook trigger"));
}

describe("StartTriggerWizard — Webhook trigger", () => {
  it("routes to WebhookTriggerStep1 instead of Step1WhenContent when picked", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("webhook-step1")).toBeInTheDocument();
  });

  it("disables Next until the webhook config is valid, then enables it", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("trigger-wizard-next")).toBeDisabled();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    expect(screen.getByTestId("trigger-wizard-next")).not.toBeDisabled();
  });

  it("advances to the shared Who-enters-the-flow step and finishes with a kind: webhook config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickWebhookTrigger();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    fireEvent.click(screen.getByTestId("trigger-wizard-next"));

    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByTestId("audience-type-block")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "webhook",
        uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
        payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
      }),
    );
  });
});
