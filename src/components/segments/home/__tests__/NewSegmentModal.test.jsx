import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NewSegmentModal from "../NewSegmentModal";

describe("NewSegmentModal", () => {
  test("renders both creation-method options with their descriptions", () => {
    render(<NewSegmentModal open onSelectFilters={jest.fn()} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId("new-segment-option-filters")).toBeInTheDocument();
    expect(screen.getByTestId("new-segment-option-csv")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by filtering customers on the basis of the events they performed, their user properties or existing segments.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by uploading a csv file that contains a list of customers and their contact details.",
      ),
    ).toBeInTheDocument();
  });

  test("clicking 'Create Segment via filters' calls onSelectFilters", () => {
    const onSelectFilters = jest.fn();
    render(<NewSegmentModal open onSelectFilters={onSelectFilters} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("new-segment-option-filters"));
    expect(onSelectFilters).toHaveBeenCalledTimes(1);
  });

  test("clicking 'Upload CSV' calls onSelectCsv", () => {
    const onSelectCsv = jest.fn();
    render(<NewSegmentModal open onSelectFilters={jest.fn()} onSelectCsv={onSelectCsv} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("new-segment-option-csv"));
    expect(onSelectCsv).toHaveBeenCalledTimes(1);
  });

  test("renders nothing when open is false", () => {
    render(<NewSegmentModal open={false} onSelectFilters={jest.fn()} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByTestId("new-segment-option-filters")).not.toBeInTheDocument();
  });
});
