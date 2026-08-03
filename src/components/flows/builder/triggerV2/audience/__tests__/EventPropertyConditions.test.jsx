import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventPropertyConditions from "../EventPropertyConditions";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

function setTriggerEvent(eventName) {
  useFlowBuilderStore.setState({
    nodes: eventName
      ? [{ id: "start", type: "trigger", data: { event_name: eventName } }]
      : [],
  });
}

describe("EventPropertyConditions (v2)", () => {
  afterEach(() => {
    useFlowBuilderStore.setState({ nodes: [] });
  });

  it("shows the placeholder when there is no trigger event", () => {
    setTriggerEvent(null);
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(
      screen.getByText("Add a start trigger event to use this filter."),
    ).toBeInTheDocument();
  });

  it("shows the locked trigger event badge, not an event picker", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByText("Trigger event:")).toBeInTheDocument();
    expect(screen.getByText("Product Viewed")).toBeInTheDocument();
  });

  it("does not render qualifier, frequency, or time-window controls", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.queryByText("Has Executed")).not.toBeInTheDocument();
    expect(screen.queryByText("Has Not Executed")).not.toBeInTheDocument();
    expect(screen.queryByText(/times$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in the last/i)).not.toBeInTheDocument();
  });

  it("renders one AttributeConditionRow per condition with an AND/OR pill between two or more", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{
          combinator: "OR",
          conditions: [
            { property: "", operator: "", value: "" },
            { property: "", operator: "", value: "" },
          ],
        }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByTestId("ep-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("ep-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("ep-combinator")).toHaveTextContent("OR");
  });

  it("adds a new flat condition (no qualifier/frequency/time_range fields) on Add condition", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    fireEvent.click(screen.getByTestId("ep-add-cond"));
    const nextBlock = onChange.mock.calls[0][0];
    expect(nextBlock.conditions).toHaveLength(2);
    expect(nextBlock.conditions[1]).toEqual(
      expect.objectContaining({ property: "", operator: "", value: "" }),
    );
    expect(nextBlock.conditions[1]).not.toHaveProperty("qualifier");
    expect(nextBlock.conditions[1]).not.toHaveProperty("frequency");
    expect(nextBlock.conditions[1]).not.toHaveProperty("time_range");
  });

  it("resets conditions to a single flat empty condition when the trigger event changes", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    const { rerender } = render(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    setTriggerEvent("Cart Abandoned");
    rerender(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    const resetCall = onChange.mock.calls.find(
      (call) => call[0].conditions?.[0]?.property === "",
    );
    expect(resetCall).toBeTruthy();
  });
});
