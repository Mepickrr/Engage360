import React from "react";
import { render, screen } from "@testing-library/react";
import FlowFormPreview from "../FlowFormPreview";

describe("FlowFormPreview", () => {
  it("renders the screen title, each component, and the Continue button", () => {
    const screenData = {
      id: "scr_1",
      title: "Your form",
      continueLabel: "Continue",
      components: [
        { id: "c1", kind: "large_heading", text: "Big title" },
        { id: "c2", kind: "short_answer", inputType: "text", label: "Name", instructions: "", required: true },
        { id: "c3", kind: "single_choice", label: "Pick one", options: ["A", "B"], required: true },
        { id: "c4", kind: "opt_in", consentLabel: "I agree", readMoreUrl: "", required: true, editContent: {} },
      ],
    };
    render(<FlowFormPreview screen={screenData} />);

    expect(screen.getByText("Your form")).toBeInTheDocument();
    expect(screen.getByText("Big title")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("I agree")).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no components yet", () => {
    render(<FlowFormPreview screen={{ id: "scr_1", title: "Your form", continueLabel: "Continue", components: [] }} />);
    expect(screen.getByText(/select 'add content'/i)).toBeInTheDocument();
  });
});
