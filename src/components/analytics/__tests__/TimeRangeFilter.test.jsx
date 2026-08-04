import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TimeRangeFilter from "../TimeRangeFilter";

// Mock the Calendar component to avoid Jest transformation issues with react-day-picker
jest.mock("@/components/ui/calendar", () => {
  return {
    Calendar: ({ mode, selected, onSelect, numberOfMonths, ...props }) => (
      <div data-testid="calendar-mock" {...props}>
        Calendar Mock
      </div>
    ),
  };
});

describe("TimeRangeFilter", () => {
  test("shows the label for the current value", () => {
    render(<TimeRangeFilter value="last_7_days" onChange={() => {}} />);
    expect(screen.getByTestId("time-range-trigger")).toHaveTextContent("Last 7 Days");
  });

  test("opens the menu and selects a preset", () => {
    const onChange = jest.fn();
    render(<TimeRangeFilter value="last_7_days" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    expect(screen.getByTestId("time-range-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("time-range-option-this_month"));
    expect(onChange).toHaveBeenCalledWith("this_month");
  });

  test("choosing Custom Range opens a calendar and applying falls back to last_7_days", () => {
    const onChange = jest.fn();
    render(<TimeRangeFilter value="last_7_days" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    fireEvent.click(screen.getByTestId("time-range-option-custom"));
    expect(screen.getByTestId("time-range-calendar")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("time-range-custom-apply"));
    expect(onChange).toHaveBeenCalledWith("last_7_days");
  });

  test("renders no BIK or Avimee strings", () => {
    const { container } = render(<TimeRangeFilter value="last_7_days" onChange={() => {}} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
