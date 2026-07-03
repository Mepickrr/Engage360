import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const webhookConfig = {
  kind: "webhook",
  webhookUrl: "https://bikapi.bikayi.app/chatbot/webhook/abcdefghijklmnop?flow=test",
  authProtected: false,
  authConfig: null,
  samplePayload: '{"vas_id": "+919999999999"}',
  payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
  uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
  secondaryId: null,
  variableMappings: [
    { payloadVariable: "vas_id", existingVariable: { category: "Customer variables", group: "Basic", key: "customer.phone", label: "Phone" } },
  ],
  audience: { include_all: true },
};

describe("StartTriggerNode — webhook trigger", () => {
  it("renders the webhook URL and unique id badge instead of the event entry list", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Unique ID: Phone Number/)).toBeInTheDocument();
    expect(screen.getByText(/vas_id/)).toBeInTheDocument();
  });

  it("shows the mapped variable count when at least one mapping exists", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/1 variable mapped/)).toBeInTheDocument();
  });

  it("does not render a mapped-variable line when there are no mappings", () => {
    const noMappings = { ...webhookConfig, variableMappings: [] };
    render(<StartTriggerNode data={{ config: noMappings, onEdit: () => {} }} selected={false} />);
    expect(screen.queryByText(/variable.*mapped/)).not.toBeInTheDocument();
  });

  it("still renders the shared Audience section for a webhook trigger", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});
