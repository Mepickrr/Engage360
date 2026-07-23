import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FlowCtaField from "../FlowCtaField";

function StatefulFlowCtaField({ initialValue = null }) {
  const [value, setValue] = useState(initialValue);
  return <FlowCtaField field={{ key: "flowCta" }} value={value} onChange={setValue} />;
}

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
    render(<StatefulFlowCtaField />);

    fireEvent.change(screen.getByDisplayValue("View Flow"), { target: { value: "Fill the form" } });

    expect(screen.getByDisplayValue("Fill the form")).toBeInTheDocument();
    // Uses a text-matcher function (RTL's own recommended fallback) because this
    // dev environment's visual-edits babel instrumentation wraps the dynamic
    // {length} expression in its own <span>, splitting "13" and "/40" across
    // sibling nodes so the literal-string matcher can't find a single element
    // whose *direct* text equals "13/40".
    expect(screen.getByText((_, el) => el?.textContent === "13/40")).toBeInTheDocument();
  });
});

describe("FlowCtaField — linked state", () => {
  const linkedValue = { buttonIcon: "default", buttonText: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" };

  it("shows the linked form name with Preview and Change actions instead of Create new/Use existing", () => {
    render(<FlowCtaField field={{ key: "flowCta" }} value={linkedValue} onChange={jest.fn()} />);

    expect(screen.getByText("Post-purchase survey")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^\+ create new$/i })).not.toBeInTheDocument();
  });

  it("clears the link when the trailing remove button is clicked", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={linkedValue} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText(/remove call to action link/i));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ flowFormId: null, flowFormName: null }));
  });
});
