import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogsFilterBar from "../LogsFilterBar";

// Same workaround used by TimeRangeFilter.test.jsx and Analytics.test.jsx:
// react-day-picker/date-fns trip Jest's ESM handling, so the Calendar
// primitive is mocked wherever a component that renders it is tested.
jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar-mock" />,
}));

function baseProps(overrides = {}) {
  return {
    search: "",
    onSearchChange: jest.fn(),
    dateFilter: { preset: "last_30_days", customRange: null },
    onDateFilterChange: jest.fn(),
    typeOptions: [{ value: "Campaign", count: 3 }, { value: "Journey", count: 2 }],
    typeSelected: new Set(),
    onTypeChange: jest.fn(),
    channelOptions: [{ value: "WhatsApp", count: 4 }],
    channelSelected: new Set(),
    onChannelChange: jest.fn(),
    statusOptions: [{ value: "Delivered", count: 5 }],
    statusSelected: new Set(),
    onStatusChange: jest.fn(),
    errorOptions: [],
    errorSelected: new Set(),
    onErrorChange: jest.fn(),
    onClearAll: jest.fn(),
    ...overrides,
  };
}

describe("LogsFilterBar", () => {
  test("typing in the search box calls onSearchChange", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-1" } });
    expect(props.onSearchChange).toHaveBeenCalledWith("ENG-1");
  });

  test("selecting a Type facet option calls onTypeChange with the value added", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("logs-filter-type-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-type-option-Campaign"));
    expect(props.onTypeChange).toHaveBeenCalledWith(new Set(["Campaign"]));
  });

  test("shows a removable chip for each selected facet value", () => {
    const props = baseProps({ channelSelected: new Set(["WhatsApp"]) });
    render(<LogsFilterBar {...props} />);
    expect(screen.getByTestId("logs-chip-channel-WhatsApp")).toBeInTheDocument();
  });

  test("removing a chip calls the facet's onChange with the value removed", () => {
    const props = baseProps({ channelSelected: new Set(["WhatsApp"]) });
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByLabelText("Remove WhatsApp filter"));
    expect(props.onChannelChange).toHaveBeenCalledWith(new Set());
  });

  test("the Error Response facet is disabled when there are no error options", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    expect(screen.getByTestId("logs-filter-error-trigger")).toBeDisabled();
  });

  test("Clear all appears once a filter is active and invokes onClearAll", () => {
    const props = baseProps({ search: "abc" });
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("logs-clear-all"));
    expect(props.onClearAll).toHaveBeenCalled();
  });
});
