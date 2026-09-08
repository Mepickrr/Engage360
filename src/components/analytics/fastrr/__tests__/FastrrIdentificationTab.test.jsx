import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FastrrIdentificationTab from "../FastrrIdentificationTab";

beforeEach(() => {
  jest.useFakeTimers();
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("FastrrIdentificationTab", () => {
  test("renders all 8 sections after the initial loading delay resolves", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    [
      "fastrr-hero-section", "fastrr-funnel-section", "fastrr-engagement-section",
      "fastrr-conversion-section", "fastrr-segments-section", "fastrr-smart-card-section",
      "fastrr-trends-section", "fastrr-source-section",
    ].forEach((id) => expect(screen.getByTestId(id)).toBeInTheDocument());
  });

  test("changing a filter shows the Hero skeleton, then resolves back to content", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-date-this_month"));
    expect(screen.getByTestId("fastrr-hero-skeleton")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.queryByTestId("fastrr-hero-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-section")).toBeInTheDocument();
  });

  test("AI Calling + Today shows the per-section empty state for engagement and conversion only", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-date-today"));
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-channel-ai-calling"));
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByTestId("fastrr-engagement-empty")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-conversion-empty")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-section")).toBeInTheDocument();
  });
});
