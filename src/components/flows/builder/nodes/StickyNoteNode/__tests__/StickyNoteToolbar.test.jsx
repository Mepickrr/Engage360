import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyNoteToolbar from "../StickyNoteToolbar";

const baseProps = {
  color: "yellow",
  onColorChange: jest.fn(),
  onFormat: jest.fn(),
  fontSize: "medium",
  onFontSizeChange: jest.fn(),
  onEmojiSelect: jest.fn(),
};

describe("StickyNoteToolbar", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls onColorChange with the clicked color key", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("green"));
    expect(baseProps.onColorChange).toHaveBeenCalledWith("green");
  });

  it("calls onFormat with the execCommand-compatible name for each format button", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Bold"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("bold");
    fireEvent.click(screen.getByTitle("Strikethrough"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("strikeThrough");
    fireEvent.click(screen.getByTitle("Underline"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("underline");
    fireEvent.click(screen.getByTitle("Italic"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("italic");
  });

  it("opens the emoji picker and forwards selection via onEmojiSelect", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Emoji"));
    expect(screen.getByTestId("sticky-note-emoji-picker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("😀"));
    expect(baseProps.onEmojiSelect).toHaveBeenCalledWith("😀");
  });

  it("calls onFontSizeChange when a size option is picked", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Text size"));
    fireEvent.click(screen.getByText(/XL — Xlarge/i));
    expect(baseProps.onFontSizeChange).toHaveBeenCalledWith("xlarge");
  });
});
