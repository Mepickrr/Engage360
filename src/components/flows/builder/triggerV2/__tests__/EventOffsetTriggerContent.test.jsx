import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EventOffsetTriggerContent, { emptyEventOffsetConfig } from "../EventOffsetTriggerContent";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial);
  return <EventOffsetTriggerContent config={config} setConfig={setConfig} />;
}

describe("emptyEventOffsetConfig", () => {
  it("defaults to 1 Hour after the given event", () => {
    expect(emptyEventOffsetConfig("Back in Stock")).toEqual({
      event: "Back in Stock",
      value: 1,
      unit: "Hours",
    });
  });
});

describe("EventOffsetTriggerContent", () => {
  it("renders the step1 container and the event name", () => {
    render(<Harness initial={emptyEventOffsetConfig("Back in Stock")} />);
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
    expect(screen.getByText("Back in Stock")).toBeInTheDocument();
  });

  it("updates the value as the seller types a new number", () => {
    render(<Harness initial={emptyEventOffsetConfig("Price Drop")} />);
    fireEvent.change(screen.getByTestId("event-offset-value-input"), { target: { value: "3" } });
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(3);
  });

  it("clamps the value to a minimum of 1", () => {
    render(<Harness initial={emptyEventOffsetConfig("Price Drop")} />);
    fireEvent.change(screen.getByTestId("event-offset-value-input"), { target: { value: "0" } });
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(1);
  });
});
