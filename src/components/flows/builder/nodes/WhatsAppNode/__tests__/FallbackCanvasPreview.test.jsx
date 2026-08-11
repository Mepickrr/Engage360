import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import WhatsAppNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));

jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const mainTemplate = {
  name: "abandoned_cart_v1",
  status: "Active",
  body: "Your cart is waiting for you!",
  footer: "Thanks for shopping with us",
  buttons: [{ label: "View Cart" }],
};

function renderNode(fallback) {
  return render(
    <WhatsAppNode
      id="node_1"
      data={{ templateStyle: "standard", template: mainTemplate, fallback }}
      selected={false}
    />
  );
}

function advance() {
  fireEvent.click(screen.getByTestId("wa-template-stack-front"));
  // the front card slides out after a 160ms timeout before the index swaps
  act(() => jest.advanceTimersByTime(200));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("WhatsAppNode — fallback canvas preview stack", () => {
  it("shows no stack when no trigger is enabled", () => {
    renderNode({
      disabled: { enabled: false, action: "template", template: null },
      categoryChanged: { enabled: false, action: "template", template: null },
    });
    expect(screen.queryByTestId("wa-template-stack-front")).not.toBeInTheDocument();
  });

  it("defaults to the primary template as the first stack card (1/2) once a fallback is configured", () => {
    renderNode({
      disabled: { enabled: true, action: "opt_out", template: null },
      categoryChanged: { enabled: false, action: "template", template: null },
    });
    expect(screen.getByTestId("wa-template-stack-front")).toBeInTheDocument();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("1 / 2");
    expect(screen.getByText("Primary Template")).toBeInTheDocument();
    expect(screen.getByText("Your cart is waiting for you!")).toBeInTheDocument();
    // A peeking card behind confirms the stack, not a flat single preview.
    expect(screen.getByTestId("wa-template-stack-peek-1")).toBeInTheDocument();
  });

  it("advancing past the primary reveals the opt-out fallback, retaining the primary's own footer and buttons and appending Stop as an extra CTA", () => {
    renderNode({
      disabled: { enabled: true, action: "opt_out", template: null },
      categoryChanged: { enabled: false, action: "template", template: null },
    });
    advance();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("2 / 2");
    expect(screen.getByText(/When Paused\/Disabled: abandoned_cart_v1_fallback/)).toBeInTheDocument();
    // Original content is kept — body, footer, and quick-reply button all still show.
    expect(screen.getByText("Your cart is waiting for you!")).toBeInTheDocument();
    expect(screen.getByText("Thanks for shopping with us")).toBeInTheDocument();
    expect(screen.getByText("View Cart")).toBeInTheDocument();
    // Opt-out line and Stop are appended on top of the retained content, not in place of it.
    expect(screen.getByText("Reply STOP to unsubscribe from promotional messages.")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
    // Header's template name follows the slide, showing the fallback's derived name.
    expect(screen.getByTestId("wa-header-template-name")).toHaveTextContent("abandoned_cart_v1_fallback");
    // Cycles back to the primary card after the last one.
    advance();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("1 / 2");
    expect(screen.getByTestId("wa-header-template-name")).toHaveTextContent("abandoned_cart_v1");
  });

  it("shows 3 total cards (primary + 2 fallbacks) with 2 peeking cards behind when both triggers are enabled", () => {
    renderNode({
      disabled: { enabled: true, action: "opt_out", template: null },
      categoryChanged: {
        enabled: true,
        action: "template",
        template: { name: "cat_changed_fallback_tpl", body: "We've updated this message.", buttons: [{ label: "Shop now" }] },
      },
    });
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("1 / 3");
    expect(screen.getByTestId("wa-template-stack-peek-1")).toBeInTheDocument();
    expect(screen.getByTestId("wa-template-stack-peek-2")).toBeInTheDocument();

    advance();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("2 / 3");

    advance();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("3 / 3");
    expect(screen.getByText("We've updated this message.")).toBeInTheDocument();
    expect(screen.getByText("Shop now")).toBeInTheDocument();
    // Both the stack caption and the header's template name reflect the
    // currently-viewed card, not the primary template.
    expect(screen.getAllByText(/cat_changed_fallback_tpl/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("wa-header-template-name")).toHaveTextContent("cat_changed_fallback_tpl");

    advance();
    expect(screen.getByTestId("wa-template-stack-counter")).toHaveTextContent("1 / 3");
    expect(screen.getByTestId("wa-header-template-name")).toHaveTextContent("abandoned_cart_v1");
  });
});
