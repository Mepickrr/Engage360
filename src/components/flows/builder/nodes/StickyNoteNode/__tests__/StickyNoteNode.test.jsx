import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyNoteNode from "../index";

const mockSetNodes = jest.fn();

jest.mock("reactflow", () => ({
  useReactFlow: () => ({ setNodes: mockSetNodes }),
}));

const baseData = { icon: "📌", heading: "Launch notes", body: "Ship by Friday", color: "yellow", fontSize: "medium" };

describe("StickyNoteNode", () => {
  beforeEach(() => mockSetNodes.mockClear());

  it("renders heading and icon, no connection handles", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    expect(screen.getByTestId("sticky-note-node")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Launch notes")).toBeInTheDocument();
    expect(screen.getByText("📌")).toBeInTheDocument();
    expect(screen.queryByTestId(/handle-/)).not.toBeInTheDocument();
  });

  it("does not render the formatting toolbar when not selected", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    expect(screen.queryByTestId("sticky-note-toolbar")).not.toBeInTheDocument();
  });

  it("renders the formatting toolbar when selected", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected />);
    expect(screen.getByTestId("sticky-note-toolbar")).toBeInTheDocument();
  });

  it("caps the heading input at 30 characters via maxLength", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    const input = screen.getByDisplayValue("Launch notes");
    expect(input).toHaveAttribute("maxlength", "30");
  });

  it("patches heading text via setNodes on change", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    const input = screen.getByDisplayValue("Launch notes");
    fireEvent.change(input, { target: { value: "New heading" } });
    expect(mockSetNodes).toHaveBeenCalled();
    const updater = mockSetNodes.mock.calls[0][0];
    const result = updater([{ id: "note1", data: baseData }]);
    expect(result[0].data.heading).toBe("New heading");
  });

  it("applies the selected color's background", () => {
    render(<StickyNoteNode id="note1" data={{ ...baseData, color: "green" }} selected={false} />);
    expect(screen.getByTestId("sticky-note-node")).toHaveStyle("background: #DCFCE7");
  });
});
