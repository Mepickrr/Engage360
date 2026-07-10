import React from "react";
import { render, screen } from "@testing-library/react";
import SMSBubblePreview from "../SMSBubblePreview";

describe("SMSBubblePreview", () => {
  it("shows a placeholder when the body is empty", () => {
    render(<SMSBubblePreview draft={{ body: "", variableMap: {} }} />);
    expect(screen.getByText(/your message will appear here/i)).toBeInTheDocument();
  });

  it("renders the raw body when it has no variable tokens", () => {
    render(<SMSBubblePreview draft={{ body: "Hello there", variableMap: {} }} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("substitutes a {{$1}} token using variableMap's mapped system-variable example", () => {
    render(
      <SMSBubblePreview
        draft={{ body: "Hi {{$1}}, thanks!", variableMap: { $1: "customer.firstName" } }}
      />
    );
    expect(screen.getByText("Hi Priya, thanks!")).toBeInTheDocument();
  });

  it("leaves an unmapped token as-is", () => {
    render(<SMSBubblePreview draft={{ body: "Code: {{$9}}", variableMap: {} }} />);
    expect(screen.getByText("Code: {{$9}}")).toBeInTheDocument();
  });
});
