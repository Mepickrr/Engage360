import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectFlowTypeModal from "../SelectFlowTypeModal";

describe("SelectFlowTypeModal", () => {
  it("lists all four flow types with Send a survey pre-selected", () => {
    render(<SelectFlowTypeModal onCancel={jest.fn()} onCreate={jest.fn()} />);

    expect(screen.getByText("Send a survey")).toBeInTheDocument();
    expect(screen.getByText("Register for an event")).toBeInTheDocument();
    expect(screen.getByText("Complete sign-up")).toBeInTheDocument();
    expect(screen.getByText("Custom form")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /send a survey/i })).toBeChecked();
  });

  it("calls onCreate with the selected type when Create is clicked", () => {
    const onCreate = jest.fn();
    render(<SelectFlowTypeModal onCancel={jest.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("radio", { name: /complete sign-up/i }));
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(onCreate).toHaveBeenCalledWith("signup");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<SelectFlowTypeModal onCancel={onCancel} onCreate={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
