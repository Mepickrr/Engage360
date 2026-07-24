import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailChipInput from "../EmailChipInput";

function Wrapper() {
  const [value, setValue] = React.useState([]);
  return <EmailChipInput value={value} onChange={setValue} placeholder="Type email" />;
}

describe("EmailChipInput", () => {
  it("commits a chip on Enter and clears the text field", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("email-chip-input-chip-a@b.com")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("commits a chip on comma", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "b@c.com" } });
    fireEvent.keyDown(input, { key: "," });
    expect(screen.getByTestId("email-chip-input-chip-b@c.com")).toBeInTheDocument();
  });

  it("does not add duplicate chips", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByTestId("email-chip-input-chip-a@b.com")).toHaveLength(1);
  });

  it("removes the last chip on Backspace when the input is empty", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.queryByTestId("email-chip-input-chip-a@b.com")).not.toBeInTheDocument();
  });

  it("removes a chip when its remove button is clicked", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByTestId("email-chip-input-remove-a@b.com"));
    expect(screen.queryByTestId("email-chip-input-chip-a@b.com")).not.toBeInTheDocument();
  });
});
