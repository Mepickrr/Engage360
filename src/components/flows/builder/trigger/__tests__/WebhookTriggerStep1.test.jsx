import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WebhookTriggerStep1, { isWebhookStep1Valid } from "../WebhookTriggerStep1";
import { emptyWebhookConfig } from "../webhookHelpers";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial || emptyWebhookConfig());
  return <WebhookTriggerStep1 config={config} setConfig={setConfig} />;
}

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

describe("WebhookTriggerStep1", () => {
  it("renders the generated webhook URL", () => {
    const cfg = emptyWebhookConfig();
    render(<Harness initial={cfg} />);
    expect(screen.getByTestId("webhook-url-input")).toHaveValue(cfg.webhookUrl);
  });

  it("copies the URL to the clipboard when Copy is clicked", () => {
    const cfg = emptyWebhookConfig();
    render(<Harness initial={cfg} />);
    fireEvent.click(screen.getByTestId("webhook-url-copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(cfg.webhookUrl);
  });

  it("reveals header/token fields when the auth checkbox is checked", () => {
    render(<Harness />);
    expect(screen.queryByTestId("webhook-auth-header")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("webhook-auth-checkbox"));
    expect(screen.getByTestId("webhook-auth-header")).toBeInTheDocument();
    expect(screen.getByTestId("webhook-auth-token")).toBeInTheDocument();
  });

  it("extracts and displays variables from a valid pasted payload", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    const list = screen.getByTestId("webhook-payload-variables");
    expect(list).toHaveTextContent("{{vas_id}}");
    expect(list).toHaveTextContent("{{order_id}}");
  });

  it("shows a parse error for invalid JSON instead of a variable list", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: "{not valid" },
    });
    expect(screen.getByTestId("webhook-payload-error")).toBeInTheDocument();
    expect(screen.queryByTestId("webhook-payload-variables")).not.toBeInTheDocument();
  });

  it("shows a success panel with variable count when Send Test Event is clicked", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    fireEvent.click(screen.getByTestId("webhook-test-event-btn"));
    expect(screen.getByTestId("webhook-test-result")).toHaveTextContent("2 variable(s) detected");
  });

  it("shows the resolved unique id value in the test result once a unique id is mapped", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    fireEvent.click(screen.getByTestId("webhook-test-event-btn"));
    expect(screen.getByTestId("webhook-test-result")).toHaveTextContent("+919999999999");
  });

  it("reveals and can remove a secondary ID row", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.click(screen.getByTestId("webhook-add-secondary-id"));
    expect(screen.getByTestId("webhook-secondary-id-type")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("webhook-remove-secondary-id"));
    expect(screen.queryByTestId("webhook-secondary-id-type")).not.toBeInTheDocument();
  });

  it("adds a variable mapping row and maps it to an existing variable", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.click(screen.getByTestId("webhook-add-var-mapping"));
    const existingSelect = screen.getByTestId("webhook-var-mapping-existing-0");
    fireEvent.change(existingSelect, { target: { value: "customer.phone" } });
    expect(existingSelect).toHaveValue("customer.phone");
  });
});

describe("isWebhookStep1Valid", () => {
  it("is false with no payload or unique id", () => {
    expect(isWebhookStep1Valid(emptyWebhookConfig())).toBe(false);
  });

  it("is false with a valid payload but no unique id set", () => {
    const cfg = { ...emptyWebhookConfig(), samplePayload: '{"a": 1}' };
    expect(isWebhookStep1Valid(cfg)).toBe(false);
  });

  it("is true once payload parses and both unique id fields are set", () => {
    const cfg = {
      ...emptyWebhookConfig(),
      samplePayload: '{"vas_id": "1"}',
      uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    };
    expect(isWebhookStep1Valid(cfg)).toBe(true);
  });

  it("is false when the payload fails to parse even if unique id is set", () => {
    const cfg = {
      ...emptyWebhookConfig(),
      samplePayload: "{broken",
      uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    };
    expect(isWebhookStep1Valid(cfg)).toBe(false);
  });
});
