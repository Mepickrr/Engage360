import React from "react";
import { render, screen } from "@testing-library/react";
import EventActionRow from "../EventActionRow";

describe("EventActionRow — inline qualifier + event dropdowns (v2)", () => {
  it("gives the qualifier dropdown a fixed width instead of the full-width default, so it sits inline with the event picker", () => {
    render(<EventActionRow value={{ qualifier: "has_done", event: "" }} onChange={jest.fn()} testId="row" />);
    const qualifierTrigger = screen.getByTestId("row-qualifier");
    expect(qualifierTrigger.className).not.toMatch(/\bw-full\b/);
    expect(qualifierTrigger.className).toContain("w-[168px]");
    expect(qualifierTrigger.className).toMatch(/\bshrink-0\b/);
  });

  it("lets the event picker grow to fill the remaining row width", () => {
    render(<EventActionRow value={{ qualifier: "has_done", event: "" }} onChange={jest.fn()} testId="row" />);
    const eventTrigger = screen.getByTestId("row-event-trigger");
    expect(eventTrigger.className).toMatch(/\bflex-1\b/);
  });

  it("keeps the qualifier and event picker as siblings in one flex row (not stacked)", () => {
    render(<EventActionRow value={{ qualifier: "has_done", event: "" }} onChange={jest.fn()} testId="row" />);
    const row = screen.getByTestId("row");
    expect(row.className).toMatch(/\bflex\b/);
    expect(row).toContainElement(screen.getByTestId("row-qualifier"));
    expect(row).toContainElement(screen.getByTestId("row-event-trigger"));
  });
});
