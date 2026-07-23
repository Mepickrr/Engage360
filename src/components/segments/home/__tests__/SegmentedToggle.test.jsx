import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SegmentedToggle from "../SegmentedToggle";

describe("SegmentedToggle", () => {
  const options = [
    { value: "retention", label: "Retention segments" },
    { value: "acquisition", label: "Acquisition segments" },
  ];

  test("renders all options and highlights the active one", () => {
    render(<SegmentedToggle testIdPrefix="fastrr" options={options} value="retention" onChange={jest.fn()} />);
    const active = screen.getByTestId("fastrr-toggle-retention");
    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("fastrr-toggle-acquisition")).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking an option calls onChange with its value", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle testIdPrefix="fastrr" options={options} value="retention" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-acquisition"));
    expect(onChange).toHaveBeenCalledWith("acquisition");
  });
});
