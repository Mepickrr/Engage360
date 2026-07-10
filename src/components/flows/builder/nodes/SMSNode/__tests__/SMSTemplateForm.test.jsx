import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SMSTemplateForm from "../SMSTemplateForm";

function Wrapper({ initial }) {
  const [draft, setDraft] = useState(initial);
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  return <SMSTemplateForm draft={draft} patch={patch} />;
}

describe("SMSTemplateForm", () => {
  it("has no SMS Gateway field (provider/sender is chosen upstream, not per-template)", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    expect(screen.queryByText(/select sms gateway/i)).not.toBeInTheDocument();
  });

  it("updates the name field via patch", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    fireEvent.change(screen.getByPlaceholderText(/cart_recovery_v1/i), { target: { value: "my_template" } });
    expect(screen.getByDisplayValue("my_template")).toBeInTheDocument();
  });

  it("shows a character/segment count that updates as the body changes", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    fireEvent.change(screen.getByPlaceholderText(/almost done/i), { target: { value: "Hello" } });
    expect(screen.getByText(/Characters: 5\/160/)).toBeInTheDocument();
  });

  it("adds a variable mapping row for each {{$n}} token in the body", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "Hi {{$1}}", shortenUrl: "", variableMap: {} }} />);
    expect(screen.getByText("{{$1}}")).toBeInTheDocument();
  });
});
