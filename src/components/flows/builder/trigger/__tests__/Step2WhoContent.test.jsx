import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Step2WhoContent from "../Step2WhoContent";

function emptyAudience() {
  return {
    include_all: true,
    include: { blocks: [{ id: "b1", type: "property", combinator: "AND", conditions: [] }], blocksCombinator: "AND" },
    exclude_enabled: false,
    exclude: { blocks: [{ id: "b2", type: "behavior", combinator: "AND", conditions: [] }], blocksCombinator: "AND" },
    limit_enabled: false,
    limit_entry: { count: 1, window: 1, unit: "days" },
    audience_kind: "all",
  };
}

function Harness({ initial }) {
  const [audience, setAudience] = useState(initial || emptyAudience());
  return <Step2WhoContent audience={audience} setAudience={setAudience} />;
}

describe("Step2WhoContent", () => {
  it("renders Limit entry frequency before the All-users/Filter-users selector", () => {
    render(<Harness />);
    const limitLabel = screen.getByText("Limit entry frequency");
    const selectorLabel = screen.getByText("All users who match the start trigger");
    // DOCUMENT_POSITION_FOLLOWING (4) means selectorLabel comes after limitLabel in the DOM.
    // eslint-disable-next-line no-bitwise
    expect(limitLabel.compareDocumentPosition(selectorLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render a Show count button", () => {
    render(<Harness />);
    expect(screen.queryByTestId("audience-show-count")).not.toBeInTheDocument();
    expect(screen.queryByText("Show count")).not.toBeInTheDocument();
  });

  it("hides Exclude Users when All users is selected", () => {
    render(<Harness />);
    expect(screen.getByTestId("audience-all-users")).toBeChecked();
    expect(screen.queryByText("Exclude Users")).not.toBeInTheDocument();
  });

  it("shows Exclude Users only after switching to Filter users by", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByText("Exclude Users")).toBeInTheDocument();
  });

  it("does not offer a User affinity filter tab", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByText("User property")).toBeInTheDocument();
    expect(screen.getByText("User behavior")).toBeInTheDocument();
    expect(screen.getByText("Custom segment")).toBeInTheDocument();
    expect(screen.queryByText("User affinity")).not.toBeInTheDocument();
  });

  it("still shows Limit entry frequency when All users is selected", () => {
    render(<Harness />);
    expect(screen.getByTestId("audience-limit-toggle")).toBeInTheDocument();
  });
});
