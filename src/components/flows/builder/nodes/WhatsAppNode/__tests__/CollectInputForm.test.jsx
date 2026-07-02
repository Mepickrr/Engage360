import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CollectInputForm from "../CollectInputForm";

describe("CollectInputForm", () => {
  const noop = () => {};

  it("renders input type selector and question message field", () => {
    render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Input Type")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what.*email/i)).toBeInTheDocument();
  });

  it("shows confirmation section for text-based types and hides it for media types", () => {
    const { rerender } = render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    // Default is email — confirmation section should exist
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
    // Change to Image — confirmation should not exist
    const select = screen.getByRole("combobox", { name: /input type/i });
    fireEvent.change(select, { target: { value: "image" } });
    expect(screen.queryByText("Confirmation")).not.toBeInTheDocument();
  });

  it("shows quick reply button editor when type is quick_reply", () => {
    render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    const select = screen.getByRole("combobox", { name: /input type/i });
    fireEvent.change(select, { target: { value: "quick_reply" } });
    expect(screen.getByText("Button Options")).toBeInTheDocument();
  });

  it("calls onApply with draft when Apply is clicked", () => {
    const onApply = jest.fn();
    render(<CollectInputForm initial={null} onApply={onApply} onCancel={noop} />);
    // Fill in the required question message before applying
    const textarea = screen.getByPlaceholderText(/what.*email/i);
    fireEvent.change(textarea, { target: { value: "What is your email?" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ isCollectInput: true, inputType: "email" }));
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CollectInputForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
