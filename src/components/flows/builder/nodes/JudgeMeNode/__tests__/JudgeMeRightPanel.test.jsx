import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JudgeMeRightPanel from "../JudgeMeRightPanel";

const makeNode = (overrides = {}) => ({
  id: "jm-1",
  type: "judgeme",
  data: {
    label: "Collect Review",
    channel: "whatsapp",
    productVar: null,
    ratingQuestion: "How would you rate your recent purchase? Please select a rating.",
    ratingButton: "Rate",
    reviewQuestion: "Please share a brief review of your experience in one line.",
    reviewError: "Your review must be at least 3 characters. Please try again.",
    retryCount: 2,
    imageEnabled: false,
    imageQuestion: "Please upload a photo of your product.",
    allowSkipImage: true,
    imageSkipLabel: "Skip",
    noResponseValue: 24,
    noResponseUnit: "hours",
    ...overrides,
  },
});

describe("JudgeMeRightPanel — channel selector", () => {
  it("renders three channel chips", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/RCS/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/i)).toBeInTheDocument();
  });

  it("clicking RCS chip calls updateNodeData with channel:rcs", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    fireEvent.click(screen.getByText(/RCS/i));
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ channel: "rcs" }));
  });
});

describe("JudgeMeRightPanel — Step 1 Rating", () => {
  it("renders rating question textarea pre-filled with default", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    const textarea = screen.getByDisplayValue("How would you rate your recent purchase? Please select a rating.");
    expect(textarea).toBeInTheDocument();
  });

  it("shows button text field for WhatsApp channel", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "whatsapp" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Rate")).toBeInTheDocument();
  });

  it("hides button text field for RCS channel", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "rcs" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.queryByDisplayValue("Rate")).not.toBeInTheDocument();
  });

  it("shows all 5 fixed rating options", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByText("⭐ 1 — Poor")).toBeInTheDocument();
    expect(screen.getByText("⭐ 5 — Excellent")).toBeInTheDocument();
  });
});

describe("JudgeMeRightPanel — Step 2 Review Text", () => {
  it("renders review question textarea", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Please share a brief review of your experience in one line.")).toBeInTheDocument();
  });

  it("editing review question calls updateNodeData", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    const textarea = screen.getByDisplayValue("Please share a brief review of your experience in one line.");
    fireEvent.change(textarea, { target: { value: "What did you think?" } });
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ reviewQuestion: "What did you think?" }));
  });
});

describe("JudgeMeRightPanel — Step 3 Image", () => {
  it("image question is hidden when imageEnabled is false", () => {
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: false })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.queryByDisplayValue("Please upload a photo of your product.")).not.toBeInTheDocument();
  });

  it("image question is shown when imageEnabled is true", () => {
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: true })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Please upload a photo of your product.")).toBeInTheDocument();
  });

  it("clicking image toggle calls updateNodeData with imageEnabled:true", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: false })} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    fireEvent.click(screen.getByTestId("image-toggle"));
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ imageEnabled: true }));
  });
});

describe("JudgeMeRightPanel — Live Preview", () => {
  it("WhatsApp preview shows list button placeholder", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "whatsapp" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-wa-rating-btn")).toBeInTheDocument();
  });

  it("RCS preview shows suggestion chips", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "rcs" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-rcs-chips")).toBeInTheDocument();
  });

  it("Instagram preview shows quick reply buttons", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "instagram" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-ig-replies")).toBeInTheDocument();
  });
});
