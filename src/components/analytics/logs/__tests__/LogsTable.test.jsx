import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogsTable from "../LogsTable";

const ROWS = [
  { id: "log-0001", sentAt: "2026-08-10T08:00:00Z", updatedAt: "2026-08-10T09:00:00Z", engageId: "ENG-1", phone: "+91 90000 00001", email: null, type: "Campaign", templateName: "order_confirmation_v2", channel: "WhatsApp", deliveryStatus: "Delivered", errorResponse: null },
  { id: "log-0002", sentAt: "2026-08-05T08:00:00Z", updatedAt: "2026-08-05T09:00:00Z", engageId: "ENG-2", phone: "+91 90000 00002", email: null, type: "Journey", templateName: "otp_verification", channel: "SMS", deliveryStatus: "Failed", errorResponse: "DND Provider level block" },
];

const SORT = { field: "sentAt", dir: "desc" };

describe("LogsTable", () => {
  test("renders one row per log", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0001")).toBeInTheDocument();
    expect(screen.getByTestId("logs-row-log-0002")).toBeInTheDocument();
  });

  test("shows an em dash when there is no error response", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0001").textContent).toContain("—");
  });

  test("shows the error text when present", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0002").textContent).toContain("DND Provider level block");
  });

  test("clicking the Sent Timestamp header requests a sort on that field", () => {
    const onSortChange = jest.fn();
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={onSortChange} onRowClick={() => {}} />);
    fireEvent.click(screen.getByTestId("logs-sort-sentAt"));
    expect(onSortChange).toHaveBeenCalledWith("sentAt");
  });

  test("clicking a row invokes onRowClick with that row", () => {
    const onRowClick = jest.fn();
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByTestId("logs-row-log-0001"));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  test("renders the empty state when there are no rows", () => {
    render(<LogsTable rows={[]} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-table-empty")).toBeInTheDocument();
  });
});
