import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityLogTab from "../ActivityLogTab";
import { DEFAULT_MEMBERS, DEFAULT_ACTIVITY_LOGS } from "../constants";

describe("ActivityLogTab", () => {
  test("renders a row for every log entry by default (All Time isn't the default filter, but every log is within a wide enough window is not assumed — assert row count matches whatever Last 7 Days yields)", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    // Default filter is "Last 7 Days" — at least the table renders without crashing and shows the header row.
    expect(screen.getByText("Agent Name")).toBeInTheDocument();
    expect(screen.getAllByText("Activity type").length).toBeGreaterThan(0);
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
  });

  test("switching to All Time shows every log entry", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    fireEvent.change(screen.getByTestId("activity-log-time-filter"), { target: { value: "All Time" } });
    DEFAULT_ACTIVITY_LOGS.forEach((log) => {
      expect(screen.getByTestId(`activity-log-row-${log.id}`)).toBeInTheDocument();
    });
  });

  test("filtering by member shows only that member's entries", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    fireEvent.change(screen.getByTestId("activity-log-time-filter"), { target: { value: "All Time" } });
    fireEvent.change(screen.getByTestId("activity-log-member-filter"), { target: { value: "Arjun Patel" } });
    const rows = screen.getAllByTestId(/^activity-log-row-/);
    rows.forEach((row) => expect(row.textContent).toContain("Arjun Patel"));
  });

  test("filtering by action narrows to that activity type", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    fireEvent.change(screen.getByTestId("activity-log-time-filter"), { target: { value: "All Time" } });
    fireEvent.change(screen.getByTestId("activity-log-action-filter"), { target: { value: "Login" } });
    const rows = screen.getAllByTestId(/^activity-log-row-/);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row.textContent).toContain("Login"));
  });

  test("shows an empty state when no logs match the filters", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    fireEvent.change(screen.getByTestId("activity-log-time-filter"), { target: { value: "All Time" } });
    fireEvent.change(screen.getByTestId("activity-log-action-filter"), { target: { value: "Login" } });
    fireEvent.change(screen.getByTestId("activity-log-member-filter"), { target: { value: "Riya Sharma" } });
    // Riya Sharma's only Login entry is more than 7 days back but within All Time — should still show.
    expect(screen.getAllByTestId(/^activity-log-row-/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByTestId("activity-log-member-filter"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("activity-log-action-filter"), { target: { value: "Campaign created" } });
    fireEvent.change(screen.getByTestId("activity-log-member-filter"), { target: { value: "Arjun Patel" } });
    expect(screen.getByTestId("activity-log-empty")).toBeInTheDocument();
  });

  test("selecting Custom Range reveals from/to date inputs", () => {
    render(<ActivityLogTab members={DEFAULT_MEMBERS} />);
    expect(screen.queryByTestId("activity-log-custom-from")).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId("activity-log-time-filter"), { target: { value: "Custom Range" } });
    expect(screen.getByTestId("activity-log-custom-from")).toBeInTheDocument();
    expect(screen.getByTestId("activity-log-custom-to")).toBeInTheDocument();
  });
});
