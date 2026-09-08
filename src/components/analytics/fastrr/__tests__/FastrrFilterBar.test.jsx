import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrFilterBar from "../FastrrFilterBar";

function baseProps(overrides = {}) {
  return {
    datePreset: "last_7_days",
    onDatePresetChange: jest.fn(),
    compare: true,
    onCompareChange: jest.fn(),
    channel: "All",
    onChannelChange: jest.fn(),
    ...overrides,
  };
}

describe("FastrrFilterBar", () => {
  test("clicking a date preset calls onDatePresetChange", () => {
    const props = baseProps();
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-date-this_month"));
    expect(props.onDatePresetChange).toHaveBeenCalledWith("this_month");
  });

  test("clicking the compare toggle calls onCompareChange with the opposite value", () => {
    const props = baseProps({ compare: true });
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-compare-toggle"));
    expect(props.onCompareChange).toHaveBeenCalledWith(false);
  });

  test("clicking a channel chip calls onChannelChange", () => {
    const props = baseProps();
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-channel-ai-calling"));
    expect(props.onChannelChange).toHaveBeenCalledWith("AI Calling");
  });

  test("the active date preset and channel are visually marked", () => {
    render(<FastrrFilterBar {...baseProps({ datePreset: "today", channel: "SMS" })} />);
    expect(screen.getByTestId("fastrr-date-today")).toHaveClass("border-primary");
    expect(screen.getByTestId("fastrr-channel-sms")).toHaveClass("border-primary");
    expect(screen.getByTestId("fastrr-date-this_month")).not.toHaveClass("border-primary");
  });
});
