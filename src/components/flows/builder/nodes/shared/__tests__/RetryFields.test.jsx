import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RetryFields } from "../DeliveryKit";

describe("RetryFields — Smart/Manual mode selector hidden", () => {
  it("does not show the Smart Retry / Manual Retry mode selector once enabled", () => {
    render(<RetryFields smartRetry={{ enabled: true }} onChange={jest.fn()} accentColor="#25D366" />);
    expect(screen.queryByText("Smart Retry (Recommended)")).not.toBeInTheDocument();
    expect(screen.queryByText("Manual Retry")).not.toBeInTheDocument();
  });

  it("still lets the seller toggle Smart Retry on/off", () => {
    const onChange = jest.fn();
    const { container } = render(<RetryFields smartRetry={{ enabled: false }} onChange={onChange} accentColor="#25D366" />);
    fireEvent.click(container.querySelector('[style*="cursor: pointer"]'));
    expect(onChange).toHaveBeenCalledWith({ enabled: true });
  });

  it("still renders manual retry count/interval fields for legacy data already in manual mode", () => {
    render(<RetryFields smartRetry={{ enabled: true, mode: "manual", retryCount: 2, retryInterval: 30 }} onChange={jest.fn()} accentColor="#25D366" />);
    expect(screen.getByText("Number of retries")).toBeInTheDocument();
    expect(screen.getByText("Retry interval")).toBeInTheDocument();
  });
});
