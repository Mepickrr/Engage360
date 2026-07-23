import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldRenderer } from "../FormFields";

function Harness({ field, initialDraft }) {
  const [draft, setDraft] = React.useState(initialDraft);
  return <FieldRenderer field={field} draft={draft} onPatch={(p) => setDraft((d) => ({ ...d, ...p }))} />;
}

describe("FieldRenderer", () => {
  it("renders a text field and patches on change", () => {
    render(<Harness field={{ key: "name", label: "Template Name", type: "text", placeholder: "e.g. foo" }} initialDraft={{ name: "" }} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. foo"), { target: { value: "cart_recovery_v1" } });
    expect(screen.getByPlaceholderText("e.g. foo")).toHaveValue("cart_recovery_v1");
  });

  it("renders a textarea field", () => {
    render(<Harness field={{ key: "body", label: "Message Body", type: "textarea", rows: 5 }} initialDraft={{ body: "hello" }} />);
    expect(screen.getByDisplayValue("hello").tagName).toBe("TEXTAREA");
  });

  it("renders a select field with string options", () => {
    render(<Harness field={{ key: "category", label: "Category", type: "select", options: ["Marketing", "Utility"] }} initialDraft={{ category: "Marketing" }} />);
    expect(screen.getByRole("combobox")).toHaveValue("Marketing");
  });

  it("renders a header-picker field with type chips", () => {
    render(<Harness field={{ key: "header", label: "Header", type: "header-picker" }} initialDraft={{ header: { type: "none" } }} />);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("renders a buttons-list field and adds a button", () => {
    render(<Harness field={{ key: "buttons", label: "Buttons", type: "buttons-list", max: 3 }} initialDraft={{ buttons: [] }} />);
    fireEvent.click(screen.getByText("+ Add Button"));
    expect(screen.getByPlaceholderText("Button label")).toBeInTheDocument();
  });

  it("does not offer 'Complete flow' as a button type when allowFlow is not set", () => {
    render(<Harness field={{ key: "buttons", label: "Buttons", type: "buttons-list", max: 3 }} initialDraft={{ buttons: [{ type: "QUICK_REPLY", label: "" }] }} />);
    expect(screen.queryByText("Complete flow")).not.toBeInTheDocument();
  });

  it("offers 'Complete flow' as a button type when allowFlow is set, and switching to it embeds the flow button row", () => {
    render(<Harness field={{ key: "buttons", label: "Buttons", type: "buttons-list", max: 3, allowFlow: true }} initialDraft={{ buttons: [{ type: "QUICK_REPLY", label: "" }] }} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "FLOW" } });

    expect(screen.getByDisplayValue("View Flow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ create new/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Button label")).not.toBeInTheDocument();
  });
});
