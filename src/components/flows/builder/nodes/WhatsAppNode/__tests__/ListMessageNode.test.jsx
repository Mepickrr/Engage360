import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const listTemplate = {
  isListMessage: true,
  header: "Pick a plan",
  body: "Choose the plan that works best for you.",
  footer: "Reply anytime",
  buttonText: "View plans",
  sections: [
    {
      title: "Monthly",
      rows: [
        { id: "row_1", title: "Basic", description: "₹199/mo" },
        { id: "row_2", title: "Pro", description: "₹499/mo" },
      ],
    },
    {
      title: "Annual",
      rows: [
        { id: "row_3", title: "Basic Annual", description: "₹1999/yr" },
      ],
    },
  ],
};

describe("WhatsAppNode — list style", () => {
  it("renders one output handle per row (btn_0, btn_1, btn_2)", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByTestId("handle-btn_0")).toBeInTheDocument();
    expect(screen.getByTestId("handle-btn_1")).toBeInTheDocument();
    expect(screen.getByTestId("handle-btn_2")).toBeInTheDocument();
  });

  it("labels ports with row titles", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Basic Annual")).toBeInTheDocument();
  });

  it("renders body text in the canvas preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText(/choose the plan/i)).toBeInTheDocument();
  });

  it("renders button label in the canvas preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText(/view plans/i)).toBeInTheDocument();
  });

  it("does not render any btn handles when templateStyle is list but template is null", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: null }}
        selected={false}
      />
    );
    expect(screen.queryByTestId("handle-btn_0")).not.toBeInTheDocument();
  });
});
