import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FlowButtonRow from "../FlowButtonRow";

function StatefulFlowButtonRow({ initialValue }) {
  const [value, setValue] = useState(initialValue);
  return <FlowButtonRow value={value} onChange={setValue} />;
}

const UNLINKED = { type: "FLOW", label: "View Flow", flowFormId: null, flowFormName: null };
const LINKED = { type: "FLOW", label: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" };

describe("FlowButtonRow — unlinked state", () => {
  it("renders Button text and Create new/Use existing actions", () => {
    render(<FlowButtonRow value={UNLINKED} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue("View Flow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use existing/i })).toBeInTheDocument();
  });

  it("patches label as the seller types, respecting the 40 char counter", () => {
    render(<StatefulFlowButtonRow initialValue={UNLINKED} />);

    fireEvent.change(screen.getByDisplayValue("View Flow"), { target: { value: "Fill the form" } });

    expect(screen.getByDisplayValue("Fill the form")).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "13/40")).toBeInTheDocument();
  });
});

describe("FlowButtonRow — linked state", () => {
  it("shows the linked form name with Preview and Change actions instead of Create new/Use existing", () => {
    render(<FlowButtonRow value={LINKED} onChange={jest.fn()} />);

    expect(screen.getByText("Post-purchase survey")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ create new/i })).not.toBeInTheDocument();
  });
});

describe("FlowButtonRow — full create/use-existing flow", () => {
  it("creates a new flow form end-to-end and links it", () => {
    const onChange = jest.fn();
    render(<FlowButtonRow value={UNLINKED} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /\+ create new/i }));
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      flowFormId: expect.stringMatching(/^ff_/),
      flowFormName: "Send a survey",
    }));
  });

  it("links an existing mock flow form via Use existing", () => {
    const onChange = jest.fn();
    render(<FlowButtonRow value={UNLINKED} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /use existing/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^select$/i })[0]);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ flowFormId: "ff_1", flowFormName: "Post-purchase survey" }));
  });

  it("opens a preview overlay from the linked chip's Preview button", () => {
    render(<FlowButtonRow value={LINKED} onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    expect(screen.getByText(/your form/i)).toBeInTheDocument();
  });
});
