import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CommunicationLogsTab from "../CommunicationLogsTab";

jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar-mock" />,
}));

describe("CommunicationLogsTab", () => {
  test("renders the full 150-row dataset within the default last-30-days window", () => {
    render(<CommunicationLogsTab />);
    expect(screen.getByTestId("logs-result-count").textContent).toBe("150 logs");
  });

  test("typing in search narrows the result count", () => {
    render(<CommunicationLogsTab />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-4800" } });
    expect(screen.getByTestId("logs-result-count").textContent).not.toBe("150 logs");
  });

  test("combining a channel filter and a status filter narrows results further than the channel filter alone", () => {
    render(<CommunicationLogsTab />);
    fireEvent.click(screen.getByTestId("logs-filter-channel-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-channel-option-WhatsApp"));
    const afterChannel = parseInt(screen.getByTestId("logs-result-count").textContent, 10);

    fireEvent.click(screen.getByTestId("logs-filter-status-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-status-option-Failed"));
    const afterBoth = parseInt(screen.getByTestId("logs-result-count").textContent, 10);

    expect(afterBoth).toBeLessThan(afterChannel);
  });

  test("shows pagination and moves to a different page of rows on click", () => {
    render(<CommunicationLogsTab />);
    expect(screen.getByTestId("logs-page-2")).toBeInTheDocument();
    const firstRowBefore = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    fireEvent.click(screen.getByTestId("logs-page-2"));
    const firstRowAfter = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    expect(firstRowAfter).not.toBe(firstRowBefore);
  });

  test("clicking a row opens the detail drawer", () => {
    render(<CommunicationLogsTab />);
    const firstRowTestId = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    fireEvent.click(screen.getByTestId(firstRowTestId));
    expect(screen.getByTestId("log-detail-drawer")).toBeInTheDocument();
  });

  test("Clear all resets search, filters, and pagination back to the full dataset", () => {
    render(<CommunicationLogsTab />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-4800" } });
    fireEvent.click(screen.getByTestId("logs-clear-all"));
    expect(screen.getByTestId("logs-result-count").textContent).toBe("150 logs");
  });
});
