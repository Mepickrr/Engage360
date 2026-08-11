import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));

jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const longName = "rosemary_wishlist_reminder_evening_batch_v3_final";

function renderNode(overrides = {}) {
  return render(
    <WhatsAppNode
      id="node_1"
      data={{
        templateStyle: "standard",
        template: { name: longName, status: "Active", body: "Hello there", buttons: [] },
        wabaNumberId: "waba_1",
        ...overrides,
      }}
      selected={false}
    />
  );
}

describe("WhatsAppNode — header", () => {
  it("renders the status tag without a separate Primary/Fallback template tag", () => {
    renderNode();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("Primary")).not.toBeInTheDocument();
  });

  it("does not show a Fallback header tag even once a fallback is configured", () => {
    renderNode({
      fallback: {
        disabled: { enabled: true, action: "opt_out", template: null },
        categoryChanged: { enabled: false, action: "template", template: null },
      },
    });
    expect(screen.getByText("Active")).toBeInTheDocument();
    // The stack's own caption text ("Fallback · When Paused/Disabled: ...")
    // is a distinct, longer string — this checks no standalone "Fallback" pill exists.
    expect(screen.queryByText("Fallback", { exact: true })).not.toBeInTheDocument();
  });

  it("shows the full template name without truncating it", () => {
    renderNode();
    expect(screen.getByText(longName)).toBeInTheDocument();
  });
});
