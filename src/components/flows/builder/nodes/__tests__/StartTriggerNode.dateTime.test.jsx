import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const dateRelativeConfig = {
  kind: "date_relative",
  dateConfig: { attribute: "date_of_birth", direction: "before", value: 7, unit: "days", repeat_annually: true },
  audience: { include_all: true },
};

const eventOffsetConfig = {
  kind: "event_offset",
  eventOffsetConfig: { event: "Back in Stock", value: 2, unit: "Hours" },
  audience: { include_all: true },
};

describe("StartTriggerNode — date_relative trigger", () => {
  it("renders the offset line and a recurrence badge", () => {
    render(<StartTriggerNode data={{ config: dateRelativeConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("7 days before Date of Birth")).toBeInTheDocument();
    expect(screen.getByText("Repeats yearly")).toBeInTheDocument();
  });

  it("omits the recurrence badge when repeat_annually is false", () => {
    const noRepeat = { ...dateRelativeConfig, dateConfig: { ...dateRelativeConfig.dateConfig, repeat_annually: false } };
    render(<StartTriggerNode data={{ config: noRepeat, onEdit: () => {} }} selected={false} />);
    expect(screen.queryByText("Repeats yearly")).not.toBeInTheDocument();
  });

  it("still renders the shared Audience section", () => {
    render(<StartTriggerNode data={{ config: dateRelativeConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});

describe("StartTriggerNode — event_offset trigger", () => {
  it("renders the offset line with no recurrence badge", () => {
    render(<StartTriggerNode data={{ config: eventOffsetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("2 Hours after Back in Stock")).toBeInTheDocument();
    expect(screen.queryByText("Repeats yearly")).not.toBeInTheDocument();
  });
});
