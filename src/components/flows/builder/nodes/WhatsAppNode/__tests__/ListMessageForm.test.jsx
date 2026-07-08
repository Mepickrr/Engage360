import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ListMessageForm from "../ListMessageForm";

const noop = () => {};

describe("ListMessageForm", () => {
  it("renders the form heading", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });

  it("renders Body Text, Button Label, Header, Footer fields", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Body Text")).toBeInTheDocument();
    expect(screen.getByText("Button Label")).toBeInTheDocument();
    expect(screen.getByText(/header/i)).toBeInTheDocument();
    expect(screen.getByText(/footer/i)).toBeInTheDocument();
  });

  it("starts with one empty section and one row pre-populated", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByPlaceholderText("Row title")).toBeInTheDocument();
  });

  it("Apply button is disabled when body and buttonText are empty", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("Apply button is enabled when body, buttonText, and one row title are filled", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
    fireEvent.change(screen.getByPlaceholderText(/choose an option/i), { target: { value: "View" } });
    fireEvent.change(screen.getByPlaceholderText("Row title"), { target: { value: "Option A" } });
    expect(screen.getByRole("button", { name: /apply/i })).not.toBeDisabled();
  });

  it("calls onApply with isListMessage:true and correct shape", () => {
    const onApply = jest.fn();
    render(<ListMessageForm initial={null} onApply={onApply} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
    fireEvent.change(screen.getByPlaceholderText(/choose an option/i), { target: { value: "View" } });
    fireEvent.change(screen.getByPlaceholderText("Row title"), { target: { value: "Option A" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        isListMessage: true,
        body: "Pick a plan",
        buttonText: "View",
        sections: expect.arrayContaining([
          expect.objectContaining({
            rows: expect.arrayContaining([
              expect.objectContaining({ title: "Option A" }),
            ]),
          }),
        ]),
      })
    );
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<ListMessageForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows + Add Row button and adds a row on click", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    const addRowBtn = screen.getByRole("button", { name: /add row/i });
    expect(addRowBtn).toBeInTheDocument();
    fireEvent.click(addRowBtn);
    expect(screen.getAllByPlaceholderText("Row title")).toHaveLength(2);
  });

  it("shows + Add Section button and adds a section on click", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    const addSectionBtn = screen.getByRole("button", { name: /add section/i });
    expect(addSectionBtn).toBeInTheDocument();
    fireEvent.click(addSectionBtn);
    // now 2 sections, each with a row title input → 2 total
    expect(screen.getAllByPlaceholderText("Row title")).toHaveLength(2);
  });

  it("displays row count against 10-row cap", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    const rowCounter = screen.getByText((content, element) => {
      return element && element.tagName === "SPAN" && /1.*10.*rows used/i.test(element.textContent);
    });
    expect(rowCounter).toBeInTheDocument();
  });

  it("pre-fills fields from initial draft", () => {
    const initial = {
      isListMessage: true,
      header: "My Header",
      body: "My body",
      footer: "My footer",
      buttonText: "Click",
      sections: [{ title: "Sec 1", rows: [{ id: "row_1", title: "Row A", description: "Desc A" }] }],
    };
    render(<ListMessageForm initial={initial} onApply={noop} onCancel={noop} />);
    expect(screen.getByDisplayValue("My body")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Click")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Row A")).toBeInTheDocument();
  });

  it("calls onChange with the live draft on every edit", () => {
    const onChange = jest.fn();
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ isListMessage: true, body: "Pick a plan" }));
  });
});
