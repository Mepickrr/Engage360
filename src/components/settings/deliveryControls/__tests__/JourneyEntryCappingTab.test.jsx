import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyEntryCappingTab from "../JourneyEntryCappingTab";

describe("JourneyEntryCappingTab — Event Rules", () => {
  it("renders an empty state with no rules by default", () => {
    render(<JourneyEntryCappingTab />);
    expect(screen.getByTestId("journey-cap-empty")).toBeInTheDocument();
    expect(screen.queryByTestId(/journey-cap-rule-/)).not.toBeInTheDocument();
  });

  it("adding a rule creates an enabled card with a default limit of 1 and no events", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));

    expect(screen.queryByTestId("journey-cap-empty")).not.toBeInTheDocument();
    const rule = screen.getByTestId("journey-cap-rule-rule-1");
    expect(rule).toBeInTheDocument();
    expect(screen.getByTestId("journey-cap-rule-rule-1-toggle")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("journey-cap-rule-rule-1-limit")).toHaveValue(1);
  });

  it("shows an auto-generated summary placeholder when no label is typed, reflecting selected events", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));

    expect(screen.getByTestId("journey-cap-rule-rule-1-label")).toHaveAttribute("placeholder", "No events selected yet");

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-event-product-viewed"));
    expect(screen.getByTestId("journey-cap-rule-rule-1-label")).toHaveAttribute("placeholder", "Product Viewed");

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-event-back-in-stock"));
    expect(screen.getByTestId("journey-cap-rule-rule-1-label")).toHaveAttribute("placeholder", "Product Viewed + 1 more");
  });

  it("lets a seller type a custom label overriding the auto-summary", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    fireEvent.change(screen.getByTestId("journey-cap-rule-rule-1-label"), { target: { value: "High Intent Events" } });
    expect(screen.getByTestId("journey-cap-rule-rule-1-label")).toHaveValue("High Intent Events");
  });

  it("supports multiple independent rules, each with their own events and limit", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-event-product-viewed"));
    fireEvent.change(screen.getByTestId("journey-cap-rule-rule-1-limit"), { target: { value: "3" } });

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-2-event-abandoned-checkout"));
    fireEvent.change(screen.getByTestId("journey-cap-rule-rule-2-limit"), { target: { value: "1" } });

    expect(screen.getByTestId("journey-cap-rule-rule-1-limit")).toHaveValue(3);
    expect(screen.getByTestId("journey-cap-rule-rule-2-limit")).toHaveValue(1);
    // Same event can be selected in more than one rule — no mutual exclusion.
    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-2-event-product-viewed"));
    expect(screen.getByTestId("journey-cap-rule-rule-1-event-product-viewed")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("journey-cap-rule-rule-2-event-product-viewed")).toHaveAttribute("aria-pressed", "true");
  });

  it("hides a rule's limit and event picker while its toggle is off, without losing its configuration", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-event-product-viewed"));

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-toggle"));
    expect(screen.queryByTestId("journey-cap-rule-rule-1-limit")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-toggle"));
    expect(screen.getByTestId("journey-cap-rule-rule-1-event-product-viewed")).toHaveAttribute("aria-pressed", "true");
  });

  it("removes a rule entirely and shows the empty state again once the last rule is deleted", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    fireEvent.click(screen.getByTestId("journey-cap-rule-rule-1-remove"));

    expect(screen.queryByTestId("journey-cap-rule-rule-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("journey-cap-empty")).toBeInTheDocument();
  });

  it("marks the Save bar dirty after adding a rule and clears it after save", () => {
    render(<JourneyEntryCappingTab />);
    expect(screen.getByTestId("journey-cap-save")).toBeDisabled();

    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    expect(screen.getByTestId("journey-cap-save")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("journey-cap-save"));
    expect(screen.getByTestId("journey-cap-save")).toBeDisabled();
  });

  it("discard reverts an unsaved rule addition", () => {
    render(<JourneyEntryCappingTab />);
    fireEvent.click(screen.getByTestId("journey-cap-add-rule"));
    expect(screen.getByTestId("journey-cap-rule-rule-1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("journey-cap-discard"));
    expect(screen.queryByTestId("journey-cap-rule-rule-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("journey-cap-empty")).toBeInTheDocument();
  });
});
