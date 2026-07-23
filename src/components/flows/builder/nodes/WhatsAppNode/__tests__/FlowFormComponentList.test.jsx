import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import FlowFormComponentList from "../FlowFormComponentList";

describe("FlowFormComponentList", () => {
  it("adds a component of the chosen kind via the nested Add content menu", () => {
    const onChange = jest.fn();
    render(<FlowFormComponentList components={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /\+ add content/i }));
    fireEvent.mouseEnter(screen.getByText("Text"));
    fireEvent.click(screen.getByText("Large heading"));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ kind: "large_heading" })]);
  });

  it("disables Add content once 8 components exist", () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, kind: "caption", text: "" }));
    render(<FlowFormComponentList components={eight} onChange={jest.fn()} />);

    expect(screen.queryByRole("button", { name: /\+ add content/i })).not.toBeInTheDocument();
  });

  it("deletes a component row", () => {
    const onChange = jest.fn();
    const components = [{ id: "c1", kind: "caption", text: "hi" }, { id: "c2", kind: "body", text: "" }];
    render(<FlowFormComponentList components={components} onChange={onChange} />);

    const rows = screen.getAllByTestId("flow-form-component-row");
    fireEvent.click(within(rows[0]).getByLabelText(/delete component/i));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: "c2" })]);
  });

  it("reorders components via drag and drop", () => {
    const onChange = jest.fn();
    const components = [{ id: "c1", kind: "caption", text: "first" }, { id: "c2", kind: "body", text: "second" }];
    render(<FlowFormComponentList components={components} onChange={onChange} />);

    const rows = screen.getAllByTestId("flow-form-component-row");
    fireEvent.dragStart(rows[1], { dataTransfer: { effectAllowed: "" } });
    fireEvent.dragOver(rows[0]);
    fireEvent.drop(rows[0]);

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({ id: "c1" }),
    ]);
  });
});
