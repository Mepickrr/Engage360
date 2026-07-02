import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";

// React Flow requires these to be mocked in tests
jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));

jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const ciTemplate = {
  isCollectInput: true,
  inputType: "email",
  questionMessage: "What is your email address?",
  retryAttempts: 3,
  noResponse: { timeoutValue: 1, timeoutUnit: "hours" },
  saveToVariable: { scope: "flow", variableName: "collected_email" },
};

describe("WhatsAppNode — collect_input style", () => {
  it("renders input type chip and question preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    // "email" appears in both badge and question — use getAllByText
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/what is your email/i)).toBeInTheDocument();
  });

  it("renders all 4 fixed output port handles", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    expect(screen.getByTestId("handle-ci_success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_no_response")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_limit_reached")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_send_failed")).toBeInTheDocument();
  });

  it("shows all 4 output port labels", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText(/no response/i)).toBeInTheDocument();
    expect(screen.getByText("Limit Reached")).toBeInTheDocument();
    expect(screen.getByText("Send Failed")).toBeInTheDocument();
  });
});
