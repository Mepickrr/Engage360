import React from "react";
import { render, screen } from "@testing-library/react";
import JudgeMeNode from "../index";

// React Flow requires these to be mocked in tests
jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));

const baseProps = (data = {}) => ({
  id: "node-1",
  selected: false,
  data,
});

describe("JudgeMeNode — unconfigured", () => {
  it("renders unconfigured state when no channel set", () => {
    render(<JudgeMeNode {...baseProps({})} />);
    expect(screen.getByText("Judge.me Review")).toBeInTheDocument();
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });
});

describe("JudgeMeNode — configured", () => {
  const configuredData = {
    channel: "whatsapp",
    productVar: "product.id",
    ratingQuestion: "How would you rate?",
    reviewQuestion: "Tell us your thoughts.",
    imageEnabled: false,
  };

  it("shows channel chip", () => {
    render(<JudgeMeNode {...baseProps(configuredData)} />);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
  });

  it("shows step summary with Rating and Review chips", () => {
    render(<JudgeMeNode {...baseProps(configuredData)} />);
    expect(screen.getAllByText(/Rating/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0);
  });

  it("shows inline bubble preview with ratingQuestion text", () => {
    render(<JudgeMeNode {...baseProps(configuredData)} />);
    expect(screen.getByText("How would you rate?")).toBeInTheDocument();
  });

  it("does not show Image chip when imageEnabled is false", () => {
    render(<JudgeMeNode {...baseProps(configuredData)} />);
    // Image chip should exist but be greyed out (not orange)
    const imageChip = screen.getByText(/Image/i);
    expect(imageChip).toHaveStyle("color: #94a3b8"); // MUTED color
  });

  it("shows Image chip when imageEnabled is true", () => {
    render(<JudgeMeNode {...baseProps({ ...configuredData, imageEnabled: true, imageQuestion: "Upload photo" })} />);
    expect(screen.getByText(/Image/i)).toBeInTheDocument();
  });

  it("shows Success, Skipped, Submission Failed handle labels", () => {
    render(<JudgeMeNode {...baseProps(configuredData)} />);
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("Submission Failed")).toBeInTheDocument();
  });
});
