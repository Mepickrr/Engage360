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

describe("EventPropertyConditions", () => {
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
    // Assert that the newly-added condition carries the trigger event
    expect(nextBlock.conditions[1].event).toBe("Product Viewed");
  });

  it("re-stamps event field when row onChange is triggered", () => {
    // Tests that the onChange wrapper at line 131 re-stamps event:
    // onChange={(nc) => setCondition(i, { ...nc, event: triggerEvent })}
    //
    // The seed condition deliberately omits `event` so the wrapper is the only source.
    // This prevents the assertion from passing due to event riding along from the seed.

    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();

    // Seed with a condition that has property and operator but NO event field.
    // The product's value input will render since operator ">" doesn't hide value.
    render(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "" }]
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );

    onChange.mockClear();

    // Find the value input — it's a plain HTML input, not a Radix Select.
    // For numeric property with ">" operator, it will be a number or text input
    // with placeholder "Enter value" (see AttributeConditionRow.jsx ValueInput default case)
    const row = screen.getByTestId("ep-row-0");
    const valueInput = row.querySelector('input[placeholder="Enter value"]');

    // Must find the input; if not, the test setup is invalid
    expect(valueInput).toBeTruthy();

    // Change the value input. This calls AttributeConditionRow's onChange with
    // { ...condition, value: "100" } where condition has no event field
    fireEvent.change(valueInput, { target: { value: "100" } });

    // The onChange callback must have been called
    expect(onChange.mock.calls.length).toBeGreaterThan(0);

    // Get the condition passed to the last onChange call
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    const updatedBlock = lastCall[0];
    const updatedCondition = updatedBlock.conditions[0];

    // CRITICAL ASSERTION: The wrapper MUST have added event, even though neither
    // the seed nor the row's onChange payload included it. If the wrapper line
    // setCondition(i, { ...nc, event: triggerEvent }) were removed, this fails.
    expect(updatedCondition.event).toBe("Product Viewed");
    expect(updatedCondition.value).toBe("100");
    expect(updatedCondition.property).toBe("Product Price");
    expect(updatedCondition.operator).toBe(">");
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
