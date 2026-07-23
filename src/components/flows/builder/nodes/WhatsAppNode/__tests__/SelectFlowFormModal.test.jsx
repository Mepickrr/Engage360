import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectFlowFormModal from "../SelectFlowFormModal";

const FORMS = [
  { id: "ff_1", name: "Post-purchase survey", flowType: "survey", updatedAt: "2 days ago", screens: [{ id: "s1", title: "s", components: [], continueLabel: "Continue" }] },
  { id: "ff_2", name: "Event RSVP", flowType: "event", updatedAt: "1 week ago", screens: [{ id: "s1", title: "s", components: [], continueLabel: "Continue" }] },
];

describe("SelectFlowFormModal", () => {
  it("lists all forms and filters by search", () => {
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={jest.fn()} />);

    expect(screen.getByText("Post-purchase survey")).toBeInTheDocument();
    expect(screen.getByText("Event RSVP")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "event" } });

    expect(screen.queryByText("Post-purchase survey")).not.toBeInTheDocument();
    expect(screen.getByText("Event RSVP")).toBeInTheDocument();
  });

  it("shows an empty state when search matches nothing", () => {
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzz" } });
    expect(screen.getByText(/no flow forms found/i)).toBeInTheDocument();
  });

  it("calls onSelect with the chosen form", () => {
    const onSelect = jest.fn();
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={onSelect} onPreview={jest.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^select$/i })[0]);

    expect(onSelect).toHaveBeenCalledWith(FORMS[0]);
  });

  it("calls onPreview with the chosen form", () => {
    const onPreview = jest.fn();
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={onPreview} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^preview$/i })[1]);

    expect(onPreview).toHaveBeenCalledWith(FORMS[1]);
  });
});
