import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailRightPanel from "../EmailRightPanel";
import { defaultEmailNodeData } from "../data/mockData";

function makeNode(overrides = {}) {
  return { id: "email_1", type: "email", data: { ...defaultEmailNodeData, ...overrides } };
}

describe("EmailRightPanel — Provider and To Email fields", () => {
  it("renders an Email Provider select above From Address, defaulting to Trust signal", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("Email Provider")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Trust signal")).toBeInTheDocument();
  });

  it("updates data.provider when a different provider is selected", () => {
    const updateNodeData = jest.fn();
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("Trust signal"), { target: { value: "karix" } });
    expect(updateNodeData).toHaveBeenCalledWith("email_1", { provider: "karix" });
  });

  it("renders a To Email dropdown defaulting to the auto-detect option, not a free-text Reply-To field", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("To Email")).toBeInTheDocument();
    expect(screen.queryByText("Reply-To Email")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Automatically detects the email address")).toBeInTheDocument();
  });

  it("sets toEmailMode to variable and stores the chosen key when a variable is selected", () => {
    const updateNodeData = jest.fn();
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("Automatically detects the email address"), { target: { value: "customer.email" } });
    expect(updateNodeData).toHaveBeenCalledWith("email_1", { toEmailMode: "variable", toEmailVariable: "customer.email" });
  });
});

describe("EmailRightPanel — Template gallery flow", () => {
  it("shows a single Select Template button and no Create New Template button when unselected", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByRole("button", { name: /select template/i })).toBeInTheDocument();
    expect(screen.queryByText("Create New Template")).not.toBeInTheDocument();
  });

  it("opens the gallery modal when Select Template is clicked, and selecting a card opens the template editor", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select template/i }));
    expect(screen.getByText("Select Email Template")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cart Recovery — Minimal"));
    expect(screen.getByText("Save Template")).toBeInTheDocument();
  });

  it("opens the template editor with a blank draft when Create new is clicked inside the gallery", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select template/i }));
    fireEvent.click(screen.getByText("+ Create new"));
    expect(screen.getByPlaceholderText(/template name/i)).toHaveValue("");
  });
});
