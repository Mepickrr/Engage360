import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateFlowFormModal from "../CreateFlowFormModal";
import { createBlankScreen } from "../data/mockFlowForms";

describe("CreateFlowFormModal — screens panel", () => {
  it("starts with the seed screens and lets you rename the active screen's title", () => {
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={jest.fn()} />);

    const titleInput = screen.getByDisplayValue("Your form");
    fireEvent.change(titleInput, { target: { value: "Feedback" } });

    expect(screen.getByDisplayValue("Feedback")).toBeInTheDocument();
  });

  it("adds a new screen up to the max of 8 and disables Add new past the cap", () => {
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Screen 1")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={jest.fn()} />);

    for (let i = 0; i < 7; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: /\+ add new/i }));
      fireEvent.change(screen.getByPlaceholderText(/screen name/i), { target: { value: `Screen ${i + 2}` } });
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    }

    expect(screen.getAllByTestId("flow-form-screen-row")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /\+ add new/i })).not.toBeInTheDocument();
  });

  it("calls onSave with the current name and screens on Save", () => {
    const onSave = jest.fn();
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: expect.any(String),
      screens: expect.arrayContaining([expect.objectContaining({ title: "Your form" })]),
    }));
  });

  it("calls onCancel on Cancel", () => {
    const onCancel = jest.fn();
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={onCancel} onSave={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
