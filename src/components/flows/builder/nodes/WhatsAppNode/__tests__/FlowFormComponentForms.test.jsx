import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentSettingsForm from "../FlowFormComponentForms";

describe("ComponentSettingsForm — text & media kinds", () => {
  it("renders a text input capped at 80 chars for large_heading", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm component={{ id: "c1", kind: "large_heading", text: "" }} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "80");
    fireEvent.change(input, { target: { value: "Welcome!" } });
    expect(onChange).toHaveBeenCalledWith({ text: "Welcome!" });
  });

  it("renders a textarea capped at 4096 chars for body", () => {
    render(<ComponentSettingsForm component={{ id: "c1", kind: "body", text: "" }} onChange={jest.fn()} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "4096");
  });

  it("renders an image height field defaulting to 400", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm component={{ id: "c1", kind: "image", url: "", height: 400 }} onChange={onChange} />);

    const heightInput = screen.getByLabelText(/image height/i);
    fireEvent.change(heightInput, { target: { value: "500" } });
    expect(onChange).toHaveBeenCalledWith({ height: "500" });
  });
});
