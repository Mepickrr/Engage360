import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FlowCtaField from "../FlowCtaField";

describe("FlowCtaField — unlinked state", () => {
  it("renders Type of action, Button icon, Button text, and Create new/Use existing actions", () => {
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={jest.fn()} />);

    expect(screen.getByText(/type of action/i)).toBeInTheDocument();
    expect(screen.getByText("Complete flow")).toBeInTheDocument();
    expect(screen.getByText(/button icon/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("View Flow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use existing/i })).toBeInTheDocument();
  });

  it("patches buttonText as the seller types, respecting the 40 char counter", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue("View Flow"), { target: { value: "Fill the form" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ buttonText: "Fill the form" }));
    // NOTE: brief specified "14/40" here, but "Fill the form".length === 13.
    // Corrected to match the actual string used in this same test (see deviation note in task-3-report.md).
    // Uses a text-matcher function (RTL's own recommended fallback) because this
    // dev environment's visual-edits babel instrumentation wraps the dynamic
    // {length} expression in its own <span>, splitting "13" and "/40" across
    // sibling nodes so the literal-string matcher can't find a single element
    // whose *direct* text equals "13/40".
    expect(screen.getByText((_, el) => el?.textContent === "13/40")).toBeInTheDocument();
  });
});
